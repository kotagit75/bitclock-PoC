import z from "zod"
import { keyToPk, median, pkToKey, skToKey } from "./util"

export type Address = string
export type Signature = number[]

class Stamp{
    constructor(public address: Address, public count: number, public sign: Signature){}
    toStringForSign(pk: string): string{
        return stampToStringForSign(pk, this.address, this.count)
    }
}
const stampToStringForSign = (pk: string, address: Address, count: number): string => pk + address + String(count)
const isValidStamp = (stamp: Stamp, pk: string): boolean => stamp.count>=0 && pkToKey(stamp.address).verify(stamp.toStringForSign(pk), Buffer.from(stamp.sign))

class Proof{
    constructor(public data: string, public stamps: Stamp[], public sk: string, public address: Address, public sign: Signature){}
    toStringForSign(){
        return proofToStringForSign(this.data, this.stamps, this.sk, this.address)
    }
    public calcTime = (): number => median(this.stamps.map((stamp, _, __) => stamp.count ?? 0))
}
const proofToStringForSign = (data: string, stamps: Stamp[], sk: string, address: Address): string => data+stamps.toString()+sk+address
const isValidProof = (proof: Proof): boolean => {
    var proof_pk = keyToPk(skToKey(proof.sk))
    const isValidStamps = proof.stamps.every((stamp, _ ,__) => isValidStamp(stamp, proof_pk))
    const isValidSign = pkToKey(proof.address).verify(proof.toStringForSign(), Buffer.from(proof.sign))
    return isValidStamps && isValidSign
}

const newProofSet = (proofs: Proof[]|undefined): Set<Proof> => {
    return new Set(proofs)
}

export { Stamp, isValidStamp, stampToStringForSign, Proof, proofToStringForSign, isValidProof, newProofSet }