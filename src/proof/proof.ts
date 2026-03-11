import { createHash } from "crypto"
import { keyToPk, pkToKey, skToKey } from "./util"
import { computeVDF, createVDFProof, verifyVDF, type VDFProof } from "./vdf"

export type Address = string
export type Signature = number[]

class Stamp{
    constructor(public address: Address, public count: number, public vdfResult: VDFProof, public sign: Signature){}
    toStringForSign(pk: string): string{
        return stampToStringForSign(pk, this.address, this.count, this.vdfResult)
    }
}
const stampToStringForSign = (pk: string, address: Address, count: number, vdfResult: VDFProof): string => pk + address + String(count) + String(vdfResult)
const calcStampHashForVDF = (address: Address, count: number): bigint => BigInt("0x"+createHash("sha256").update(address + String(count)).digest('hex'))
const N = 9999999967n * 9999999973n
const T = 100000
const calcVDFResult = (address: Address, count: number): VDFProof => {
    const hash = calcStampHashForVDF(address, count)
    return createVDFProof(hash, computeVDF(hash, T, N), T, N)
}
const isValidStamp = (stamp: Stamp, pk: string): boolean => {
    const isValidCount = stamp.count>=0
    const isValidVDF = verifyVDF(calcStampHashForVDF(stamp.address, stamp.count), stamp.vdfResult, T, N)
    const isValidSign = pkToKey(stamp.address).verify(stamp.toStringForSign(pk), Buffer.from(stamp.sign))
    return isValidCount && isValidVDF && isValidSign
}
class Proof{
    constructor(public data: string, public stamps: Stamp[], public sk: string, public address: Address, public sign: Signature){}
    toStringForSign(){
        return proofToStringForSign(this.data, this.stamps, this.sk, this.address)
    }
}
const proofToStringForSign = (data: string, stamps: Stamp[], sk: string, address: Address): string => data+stamps.toString()+sk+address
const isValidProof = (proof: Proof): boolean => {
    var proof_pk = keyToPk(skToKey(proof.sk))
    const isValidStamps = proof.stamps.every((stamp, _ ,__) => isValidStamp(stamp, proof_pk))
    const isValidSign = pkToKey(proof.address).verify(proof.toStringForSign(), Buffer.from(proof.sign))
    return isValidStamps && isValidSign
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

export { Stamp, isValidStamp, calcVDFResult, stampToStringForSign, Proof, proofToStringForSign, isValidProof, newProofSet, compareTime }