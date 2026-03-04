import z, { ZodArray, ZodObject } from "zod"
import { newProofSet, Proof, Stamp } from "./proof/proof"
import { flow, pipe } from "fp-ts/lib/function"
import { Message } from "./p2p"

const stampSchema = z.object({
  address: z.string(),
  count: z.number(),
  sign: z.number().array(),
})
const proofSchema = z.object({
  data: z.string(),
  stamps: stampSchema.array(),
  sk: z.string(),
  address: z.string(),
  sign: z.number().array(),
})
const messageSchema = z.object({
    type: z.enum(["NONE", "REQUEST_STAMP", "UPDATE_PROOFPOOL"]),
    data: z.string(),
})
const proofPoolSchema = proofSchema.array()
const exportProof = (proof: Proof): string => {
    return JSON.stringify(proof)
}
const exportStamp = (stamp: Stamp): string => {
    return JSON.stringify(stamp)
}
const exportProofPool = (proofPool: Set<Proof>): string => {
    return JSON.stringify(Array.from(proofPool))
}
const exportMessage = (message: Message): string => {
    return JSON.stringify(message)
}
const import_ = <T extends object>(schema: ZodObject|ZodArray) => {
    return (exported: string): T|undefined => {
        const parsed = JSON.parse(exported)
        const result = schema.safeParse(parsed)
        if(result.success) {
            return parsed
        }else {
            return undefined
        }
    }
}
const importStamp = import_<Stamp>(stampSchema)
const importProof = import_<Proof>(proofSchema)
const importProofPool = flow(import_<Proof[]>(proofPoolSchema), newProofSet)
const importMessage = import_<Message>(messageSchema)

export { exportProof, exportStamp, exportProofPool, exportMessage, importStamp, importProof, importProofPool, importMessage }