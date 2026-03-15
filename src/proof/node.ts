import NodeRSA from "node-rsa";
import fs from "fs";

import { keyToPk, keyToSk, skToKey } from "@/util";
import { calcNonce, compareTime, isValidProof, Proof, PROOF_KEY_SIZE, proofToStringForSign, Stamp, stampToStringForSign, type Address, type Signature } from "./proof";
import { Counter } from "./counter";
import { broadcastAndGetRequestStamps, broadcastUpdateProofPool } from "../p2p";
import { logger } from "@/logger";

const NODE_KEY_SIZE = 2048

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
    var myStamp = createStamp(pk, difficulty)
    var peerStamps = await broadcastAndGetRequestStamps(pk, difficulty)
    return peerStamps.concat(myStamp)
}
const createProof = async (data: string): Promise<Proof> => {
    var proofKey = new NodeRSA({ b: PROOF_KEY_SIZE })
    const difficulty = calcDifficulty()
    logger.info("NODE", "Creating proof. difficulty:", difficulty)
    var stamps = await fetchStamps(keyToPk(proofKey), difficulty)
    var sk = keyToSk(proofKey)
    var stringforSign = proofToStringForSign(data, stamps, sk, getAddress())
    return new Proof(data, stamps, sk, getAddress(), createSign(stringforSign), difficulty)
}
const sortProofPool = (): Proof[] => Array.from(proofPool).sort(compareTime)
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
    const isValidStampCounts = proof.stamps.every((stamp, _, __) => getLastestCountOfAddress(stamp.address)+1 == stamp.count)
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
        isProofAddedToSet.push(await addProof(proof))
    }
    if (isProofAddedToSet.includes(true) || proofPool.difference(newProofPool).size > 0) {
        broadcastUpdateProofPool(proofPool)
    }
}

// Difficulty should be bigger.
const calcDifficulty = (): number =>{
    const base = 3
    return base
}

export { initNode, getAddress, createSign, createStamp, createProof, addProof, getProofPool, updateProofPool }