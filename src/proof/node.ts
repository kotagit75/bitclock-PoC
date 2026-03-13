import NodeRSA from "node-rsa";
import fs from "fs";

import { keyToPk, keyToSk, skToKey } from "./util";
import { calcVDFResult, isValidProof, Proof, proofToStringForSign, Stamp, stampToStringForSign, type Address, type Signature } from "./proof";
import { Counter } from "./counter";
import { broadcastAndGetRequestStamps, broadcastRequestStamps, broadcastUpdateProofPool } from "../p2p";
import { logger } from "@/logger";
import { initVDFResult } from "./vdf";

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
    counter = new Counter(0)
}
const generateNodeKey = () => {
    nodeKey = new NodeRSA({ b: 512 })
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
const createStamp = (pk: string): Stamp => {
    const count = counter.increment()
    const vdfResult = calcVDFResult(getAddress(), count, pk)
    const sign = createSign(stampToStringForSign(pk, getAddress(), count, vdfResult))
    return new Stamp(getAddress(), count, pk, vdfResult, sign)
}
const fetchStamps = async (pk: string): Promise<Stamp[]> => {
    var myStamp = createStamp(pk)
    var peerStamps = await broadcastAndGetRequestStamps(pk)
    return peerStamps.concat(myStamp)
}
const createProof = async (data: string): Promise<Proof> => {
    var proofKey = new NodeRSA({ b: 512 })
    var stamps = await fetchStamps(keyToPk(proofKey))
    var sk = keyToSk(proofKey)
    var stringforSign = proofToStringForSign(data, stamps, sk, getAddress())
    return new Proof(data, stamps, sk, getAddress(), createSign(stringforSign))
}
const getLastestStampOfAddress = (address: Address): Stamp|undefined => {
    var lastestStamp = Array.from(proofPool).flatMap((proof, _, __) => proof.stamps).filter((stamp, _, __) => stamp.address == address).reduce((a,b)=>a.count>b.count?a:b, new Stamp("", -1, "", initVDFResult, []))
    if(lastestStamp.count < 0) {
        return undefined
    }
    return lastestStamp
}
const getLastestCountOfAddress = (address: Address): number => {
    var lastestStamp = getLastestStampOfAddress(address)
    if(!lastestStamp) {
        return -1
    }
    return lastestStamp.count
}
const minValidStampRate = 0.8
const checkProofStamps = async (proof: Proof): Promise<boolean> => {
    var key = new NodeRSA({ b: 512 })
    var addressesForCheck = (await fetchStamps(keyToPk(key))).map((stamp, _, __) => stamp.address)
    var addressesOfProof = proof.stamps.map((stamp, _, __) => stamp.address)
    const numberOfIncludedAddresses = addressesOfProof.map((address, _, __) => addressesForCheck.includes(address)).filter(Boolean).length
    const stampRate = numberOfIncludedAddresses/addressesOfProof.length
    const isValidStampAddressesRate = stampRate >= minValidStampRate
    const isValidStampCounts = proof.stamps.every((stamp, _, __) => getLastestCountOfAddress(stamp.address) < stamp.count)
    return isValidStampAddressesRate && isValidStampCounts
}
const addProof = async (proof: Proof): Promise<boolean> => {
    if (isValidProof(proof) && await checkProofStamps(proof)){
        proofPool.add(proof)
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

export { initNode, getAddress, createSign, createStamp, createProof, addProof, getProofPool, updateProofPool }