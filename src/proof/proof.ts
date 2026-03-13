import { hashSHA256, keyToPk, pkToKey, skToKey } from "./util"

export type Address = string
export type Signature = number[]

class Stamp{
    constructor(public address: Address, public count: number, public pk: string, public nonce: number, public sign: Signature){}
    toStringForSign(): string{
        return stampToStringForSign(this.pk, this.address, this.count, this.nonce)
    }
}
const stampToStringForSign = (pk: string, address: Address, count: number, nonce: number): string => pk + address + String(count) + String(nonce)

const baseCost = 6
const Cost = baseCost
const verifyNonce = (address: Address, count: number, pk: string, nonce: number, cost: number): boolean=>hashSHA256(address + String(count) + pk + String(nonce)).startsWith("0".repeat(cost))
const calcNonce = (address: Address, count: number, pk: string): number => {
    const cost = Cost
    var nonce = 0
    while(!verifyNonce(address, count, pk, nonce, cost)){
        nonce++
    }
    return nonce
}
const isValidStamp = (stamp: Stamp, pk: string): boolean => {
    const isValidCount = stamp.count>=0
    const cost = Cost
    const isValidNonce = verifyNonce(stamp.address, stamp.count, pk, stamp.nonce, cost)
    const isValidSign = pkToKey(stamp.address).verify(stamp.toStringForSign(), Buffer.from(stamp.sign))
    return isValidCount && isValidNonce && isValidSign
}
class Proof{
    constructor(public data: string, public stamps: Stamp[], public sk: string, public address: Address, public sign: Signature){}
    toStringForSign(){
        return proofToStringForSign(this.data, this.stamps, this.sk, this.address)
    }
}
const proofToStringForSign = (data: string, stamps: Stamp[], sk: string, address: Address): string => data+stamps.toString()+sk+address
const MAX_NUMBER_OF_STAMPS = 1
const isValidProof = (proof: Proof): boolean => {
    var proof_pk = keyToPk(skToKey(proof.sk))
    const isValidStamps = proof.stamps.every((stamp, _ ,__) => isValidStamp(stamp, proof_pk))
    const isValidNumberOfStamps = proof.stamps.length <= MAX_NUMBER_OF_STAMPS
    const isValidSign = pkToKey(proof.address).verify(proof.toStringForSign(), Buffer.from(proof.sign))
    return isValidStamps && isValidNumberOfStamps && isValidSign
}
const compareTime = (proof1: Proof, proof2: Proof): number => {
    const findStamp = (stamps: Stamp[], address: Address) => stamps.find((stamp, _, __) => stamp.address == address)

    const results: number[] = proof1.stamps.map((stamp, _, __) => {
        const address = stamp.address
        const stamp1 = findStamp(proof1.stamps, address)
        const stamp2 = findStamp(proof2.stamps, address)
        if(!stamp1 || !stamp2) {
            return 0
        }
        const diff = stamp1.count - stamp2.count
        if(diff == 0) {
            return 0
        }else if(diff > 0) {
            return 1
        }else {
            return -1
        }
    })
    return results.reduce((sum, k) => sum + k, 0)
}

const newProofSet = (proofs: Proof[]|undefined): Set<Proof> => {
    return new Set(proofs)
}

export { Stamp, isValidStamp, calcNonce, stampToStringForSign, Proof, proofToStringForSign, MAX_NUMBER_OF_STAMPS, isValidProof, newProofSet, compareTime }