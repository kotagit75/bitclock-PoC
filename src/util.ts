import { createHash } from "crypto";
import NodeRSA from "node-rsa";

const toHexString = (buf: Buffer): string => {
    return buf.toString("hex")
}
const toBuffer = (str: string): Buffer => {
    return Buffer.from(str, "hex")
}

function pkToKey(pk: string): NodeRSA {
    var key = new NodeRSA()
    key.importKey(toBuffer(pk), "pkcs1-public-der")
    return key
}
function skToKey(sk: string): NodeRSA {
    var key = new NodeRSA()
    key.importKey(toBuffer(sk), "pkcs1-private-der")
    return key
}
function keyToPk(key: NodeRSA): string {
    return toHexString(key.exportKey("pkcs1-public-der"))
}
function keyToSk(key: NodeRSA): string {
    return toHexString(key.exportKey("pkcs1-private-der"))
}

const median = (numbers: number[]): number => {
  const half = (numbers.length / 2) | 0
  const arr = numbers.sort((a, b) => {
    return a - b
  })
  if (arr.length % 2) {
    return arr[half]
  }
  return (arr[half - 1] + arr[half]) / 2
}

const hashSHA256 = (data: string): string => createHash("sha256").update(data).digest('hex')
const hashSHA256ToNumber = (data: string): number => Number("0x"+createHash("sha256").update(data).digest('hex'))

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const isDuplicated = <T,>(elements: T[]): boolean => {
    const elementsToSetObject = new Set(elements);
    return !(elementsToSetObject.size === elements.length);
}

type Status = {
    status: string
    uptime: number
    resource: {
        memory: number
    }
}
const getStatus = (): Status => ({
    "status": "running",
    "uptime": process.uptime(),
    "resource": {
        "memory": process.memoryUsage().heapUsed,
    },
})

export { toHexString, toBuffer, pkToKey, skToKey, keyToPk, keyToSk, median, hashSHA256, hashSHA256ToNumber, sleep, isDuplicated, getStatus }