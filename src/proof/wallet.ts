import NodeRSA from "node-rsa";

import { keyToPk, keyToSk } from "./util";
import { isValidProof, Proof, proofToStringForSign, Stamp, stampToStringForSign, type Address, type Signature } from "./proof";
import { Counter } from "./counter";
import { broadcastRequestStamps, broadcastUpdateProofPool } from "../p2p";
import { logger } from "@/logger";

var wallet_key: NodeRSA
var address: Address
var counter: Counter
var proofPool: Set<Proof> = new Set([])

const initWallet = () => {
    wallet_key = new NodeRSA({ b: 512 })
    address = keyToPk(wallet_key)
    counter = new Counter(0)
    logger.info("Wallet", "Generated wallet key")
}
const getAddress = (): Address => address
const getProofPool = (): Set<Proof> => proofPool
const createSign = (data: string): Signature => Array.from(wallet_key.sign(data))
const createStamp = (pk: string): Stamp => {
    var count = counter.increment()
    var sign = createSign(stampToStringForSign(pk, getAddress(), count))
    return new Stamp(getAddress(), count, sign)
}
const fetchStamps = async (pk: string): Promise<Stamp[]> => {
    var myStamp = createStamp(pk)
    var peerStamps = await broadcastRequestStamps(pk)
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
    var lastestStamp = Array.from(proofPool).flatMap((proof, _, __) => proof.stamps).filter((stamp, _, __) => stamp.address == address).reduce((a,b)=>a.count>b.count?a:b, new Stamp("", -1, []))
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
const checkProofStamps = async (proof: Proof): Promise<boolean> => {
    var key = new NodeRSA({ b: 512 })
    var addressesForCheck = (await fetchStamps(keyToPk(key))).map((stamp, _, __) => stamp.address)
    var addressesOfProof = proof.stamps.map((stamp, _, __) => stamp.address)
    const isValidStampAddresses = addressesOfProof.every((address, _, __) => addressesForCheck.includes(address))
    const isValidStampCounts = proof.stamps.every((stamp, _, __) => getLastestCountOfAddress(stamp.address) < stamp.count)
    return isValidStampAddresses && isValidStampCounts
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
    await newProofPool.forEach(async (proof, _, __) => isProofAddedToSet.push(await addProof(proof)))
    if (isProofAddedToSet.includes(true) || proofPool.difference(newProofPool).size > 0) {
        broadcastUpdateProofPool(proofPool)
    }
}

export { initWallet, getAddress, createSign, createStamp, createProof, addProof, getProofPool, updateProofPool }