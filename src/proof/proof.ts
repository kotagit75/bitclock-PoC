import { hashSHA256, isDuplicated, keyToPk, median, pkToKey, skToKey } from "@/util"

export type Address = string
export type Signature = number[]

class Stamp{
    constructor(public address: Address, public count: number, public pk: string, public nonce: number, public index: number, public sign: Signature){}
}
const stampToStringForSign = (pk: string, address: Address, count: number, nonce: number): string => pk + address + String(count) + String(nonce)

const verifyNonce = (address: Address, count: number, pk: string, nonce: number, cost: number): boolean=>hashSHA256(pk + address + String(count) + String(nonce)).startsWith("0".repeat(cost))
const calcNonce = (address: Address, count: number, pk: string, difficulty: number): number => {
    var nonce = 0
    while(!verifyNonce(address, count, pk, nonce, difficulty)){
        nonce++
    }
    return nonce
}
const isValidStamp = (stamp: Stamp, proof_pk: string, difficulty: number): boolean => {
    const isValidCount = stamp.count>=0
    const isValidPk = stamp.pk == proof_pk
    const isValidNonce = verifyNonce(stamp.address, stamp.count, proof_pk, stamp.nonce, difficulty)
    const isValidSign = pkToKey(stamp.address).verify(stampToStringForSign(stamp.pk, stamp.address, stamp.count, stamp.nonce), Buffer.from(stamp.sign))
    return isValidCount && isValidNonce && isValidSign && isValidPk
}
class Proof{
    constructor(public data: string, public stamps: Stamp[], public sk: string, public address: Address, public sign: Signature, public difficulty: number, public time: number){}
}
const sumOfCount = (stamps: Stamp[]): number => {
    return stamps.reduce((sum, k) => sum + k.count, 0)
}

const PROOF_KEY_SIZE = 512
const proofToStringForSign = (data: string, stamps: Stamp[], sk: string, address: Address): string => data+JSON.stringify(stamps)+sk+address
const MIN_NUMBER_OF_STAMPS = 3
const isValidProof = (proof: Proof): boolean => {
    var proof_pk = keyToPk(skToKey(proof.sk))
    const isValidStamps = proof.stamps.every((stamp, _ ,__) => isValidStamp(stamp, proof_pk, proof.difficulty))
    const isValidNumberOfStamps = proof.stamps.length >= MIN_NUMBER_OF_STAMPS
    const isNotDuplicatedStamps = !isDuplicated(proof.stamps)
    const isValidSign = pkToKey(proof.address).verify(proofToStringForSign(proof.data, proof.stamps, proof.sk, proof.address), Buffer.from(proof.sign))
    return isValidStamps && isNotDuplicatedStamps && isValidNumberOfStamps && isValidSign
}

// Compare the sum of the counts of addresses that appear in both proof1 and proof2
const compareTime = (proof1: Proof, proof2: Proof): number => {
    const proof1DuplicatedStamps = proof1.stamps.concat(proof2.stamps).filter((stamp, index, stamps) => stamps.findLastIndex((_stamp,_,__)=>stamp.address == _stamp.address) != index)
    const proof2DuplicatedStamps = proof2.stamps.concat(proof1.stamps).filter((stamp, index, stamps) => stamps.findLastIndex((_stamp,_,__)=>stamp.address == _stamp.address) != index)
    return sumOfCount(proof1DuplicatedStamps) - sumOfCount(proof2DuplicatedStamps)
}

const newProofSet = (proofs: Proof[]|undefined): Set<Proof> => {
    return new Set(proofs)
}

export { Stamp, isValidStamp, calcNonce, stampToStringForSign, Proof, proofToStringForSign, MIN_NUMBER_OF_STAMPS, PROOF_KEY_SIZE, isValidProof, newProofSet, compareTime }