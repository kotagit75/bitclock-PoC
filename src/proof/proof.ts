import { hashSHA256, keyToPk, median, pkToKey, skToKey } from "@/util"

export type Address = string
export type Signature = number[]

class Stamp{
    constructor(public address: Address, public count: number, public pk: string, public nonce: number, public sign: Signature){}
    toStringForSign(): string{
        return stampToStringForSign(this.pk, this.address, this.count, this.nonce)
    }
}
const stampToStringForSign = (pk: string, address: Address, count: number, nonce: number): string => pk + address + String(count) + String(nonce)

const verifyNonce = (address: Address, count: number, pk: string, nonce: number, cost: number): boolean=>hashSHA256(address + String(count) + pk + String(nonce)).startsWith("0".repeat(cost))
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
    const isValidSign = pkToKey(stamp.address).verify(stamp.toStringForSign(), Buffer.from(stamp.sign))
    return isValidCount && isValidNonce && isValidSign && isValidPk
}
class Proof{
    constructor(public data: string, public stamps: Stamp[], public sk: string, public address: Address, public sign: Signature, public difficulty: number){}
    toStringForSign(){
        return proofToStringForSign(this.data, this.stamps, this.sk, this.address)
    }
    sumOfCount(): number{
        return this.stamps.reduce((sum, k) => sum + k.count, 0)
    }
    medianOfCount(): number{
        return median(this.stamps.map((s,_,__)=>s.count))
    }
}
const PROOF_KEY_SIZE = 2048
const proofToStringForSign = (data: string, stamps: Stamp[], sk: string, address: Address): string => data+JSON.stringify(stamps)+sk+address
const MAX_NUMBER_OF_STAMPS = 1
const isValidProof = (proof: Proof): boolean => {
    var proof_pk = keyToPk(skToKey(proof.sk))
    const isValidStamps = proof.stamps.every((stamp, _ ,__) => isValidStamp(stamp, proof_pk, proof.difficulty))
    const isValidNumberOfStamps = proof.stamps.length <= MAX_NUMBER_OF_STAMPS
    const isValidSign = pkToKey(proof.address).verify(proof.toStringForSign(), Buffer.from(proof.sign))
    return isValidStamps && isValidNumberOfStamps && isValidSign
}
const compareTime = (proof1: Proof, proof2: Proof): number => {
    return proof1.sumOfCount() - proof2.sumOfCount()
}

const newProofSet = (proofs: Proof[]|undefined): Set<Proof> => {
    return new Set(proofs)
}

export { Stamp, isValidStamp, calcNonce, stampToStringForSign, Proof, proofToStringForSign, MAX_NUMBER_OF_STAMPS, PROOF_KEY_SIZE, isValidProof, newProofSet, compareTime }