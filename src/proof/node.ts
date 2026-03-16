import NodeRSA from "node-rsa";
import fs from "fs";

import { keyToPk, keyToSk, skToKey } from "@/util";
import { calcNonce, compareTime, isValidProof, Proof, PROOF_KEY_SIZE, proofToStringForSign, Stamp, stampToStringForSign, type Address, type Signature } from "./proof";
import { Counter } from "./counter";
import { broadcastAndGetRequestStamps, broadcastUpdateProofPool } from "../p2p";
import { logger } from "@/logger";

const NODE_KEY_SIZE = 512

var nodeKey: NodeRSA
var address: Address
var counter: Counter
var proofPool: Set<Proof> = new Set([])

const nodeDirPath: string = 'node'
const nodeKeyPath: string = 'node/key'

const initNode = () => {
    if (!fs.existsSync(nodeDirPath)) {
        fs.mkdirSync(nodeDirPath, { recursive: true });
    }
    if(!fs.existsSync(nodeKeyPath)){
        generateNodeKey()
    }else{
        readNodeKey()
    }
    address = keyToPk(nodeKey)
    counter = new Counter(getLastestCountOfMine())
}
const generateNodeKey = () => {
    nodeKey = new NodeRSA({ b: NODE_KEY_SIZE })
    fs.writeFileSync(nodeKeyPath, keyToSk(nodeKey))
    logger.info("NODE", "Generated node key")
}
const readNodeKey = () => {
    nodeKey = skToKey(fs.readFileSync(nodeKeyPath).toString())
    logger.info("NODE", "Read node key")
}

const getAddress = (): Address => address
const getProofPool = (): Set<Proof> => proofPool
const createSign = (data: string): Signature => Array.from(nodeKey.sign(data))
const createStamp = (pk: string, difficulty: number): Stamp => {
    const count = counter.getCount()+1
    const nonce = calcNonce(getAddress(), count, pk, difficulty)
    const sign = createSign(stampToStringForSign(pk, getAddress(), count, nonce))
    return new Stamp(getAddress(), count, pk, nonce, sign)
}
const fetchStamps = async (pk: string, difficulty: number): Promise<Stamp[]> => {
    return await broadcastAndGetRequestStamps(pk, difficulty)
}
const createProof = async (data: string): Promise<Proof> => {
    var proofKey = new NodeRSA({ b: PROOF_KEY_SIZE })
    const time = Date.now()
    const difficulty = calcDifficulty(time)
    logger.info("NODE", "Creating proof. difficulty:", difficulty)
    var stamps = await fetchStamps(keyToPk(proofKey), difficulty)
    var sk = keyToSk(proofKey)
    var stringforSign = proofToStringForSign(data, stamps, sk, getAddress())
    return new Proof(data, stamps, sk, getAddress(), createSign(stringforSign), difficulty, time)
}
const sortProofPool = (): Proof[] => Array.from(proofPool).sort(compareTime).reverse()

// returns [the lastest, ..., the oldest]
const sortProofPoolTimes = (): number[] => Array.from(proofPool).map((p,_,__)=>p.time).sort((a,b)=>b-a)
const getLastestProofs = (numberOfStamps: number): Proof[] => sortProofPool().slice(0,numberOfStamps)
const getLastestStampOfAddress = (address: Address): Stamp|undefined => {
    var lastestStamp = Array.from(proofPool).flatMap((proof, _, __) => proof.stamps).filter((stamp, _, __) => stamp.address == address).reduce((a,b)=>a.count>b.count?a:b, new Stamp("", -1, "", 0, []))
    if(lastestStamp.count < 0) {
        return undefined
    }
    return lastestStamp
}
const getLastestCountOfAddress = (address: Address): number => {
    var lastestStamp = getLastestStampOfAddress(address)
    if(!lastestStamp) {
        return 0
    }
    return lastestStamp.count
}
const getLastestCountOfMine = ():number => getLastestCountOfAddress(getAddress())

const checkProofStamps = async (proof: Proof): Promise<boolean> => {
    const findStampsByAddress = (address: Address): Stamp[] => proof.stamps.filter((stamp, _, __) => stamp.address == address)
    const findCountsByAddress = (address: Address): number[] => findStampsByAddress(address).map((s,_,__)=>s.count)
    const addresses = Array.from(new Set(proof.stamps.map((s,_,__)=>s.address)))// Remove duplicates
    const isValidStampCounts = addresses.every((address,_,__)=>{
        const lastestCount = getLastestCountOfAddress(address)+1
        return findCountsByAddress(address).every((count,_,__)=>count==lastestCount)
    })
    return isValidStampCounts
}
const addProof = async (proof: Proof): Promise<boolean> => {
    if (isValidProof(proof) && await checkProofStamps(proof)){
        proofPool.add(proof)
        const stamp = proof.stamps[proof.stamps.map((s, _, __) => s.address).indexOf(getAddress())]
        if(stamp != undefined){
            counter.increment()
        }
        return true
    }
    return false
}
const updateProofPool = async (newProofPool: Set<Proof>) => {
    var isProofAddedToSet: boolean[] = []
    for (const proof of newProofPool) {
        const isInclued = proofPool.has(proof)
        const isAddedToPool = await addProof(proof)
        isProofAddedToSet.push(isInclued && isAddedToPool)
    }
    if (isProofAddedToSet.includes(true) || proofPool.difference(newProofPool).size > 0) {
        broadcastUpdateProofPool(proofPool)
    }
}

function getClamped<T>(arr: T[], index: number): T|undefined {
  return arr[Math.min(index, arr.length - 1)];
}
const calcActualTime = (endTime: number): number|undefined => {
    const times = sortProofPoolTimes()
    const lastestIndexBeforeEndTime = times.findIndex((v,_,__)=>v<endTime)
    const startTime = getClamped(times, lastestIndexBeforeEndTime+5)
    if(!startTime){
        return undefined
    }
    return endTime - startTime
}

const calcDifficulty = (endTime: number): number =>{
    const base = 3
    const targetTime = 10000
    const lastestIndexBeforeEndTime = sortProofPoolTimes().findIndex((v,_,__)=>v<endTime)
    const oldProof = sortProofPool()[lastestIndexBeforeEndTime]
    const actualTime = calcActualTime(endTime)
    if(!oldProof){
        return base
    }
    if(!actualTime){
        return oldProof.difficulty
    }
    var rate = targetTime / actualTime
    if(rate < 0.9){
        rate = 0.9
    }else if(rate > 1.1){
        rate = 1.1
    }
    return rate*oldProof.difficulty
}

export { initNode, getAddress, createSign, createStamp, createProof, addProof, getProofPool, updateProofPool }