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

var median = (arr: number[]): number => {
    var half = (arr.length/2)|0;
    var sortedArray = arr.sort(
        function(x, y) {
        return x - y;
    });

    if (sortedArray) {
        return sortedArray[half] ?? 0;
    }
    return ((sortedArray[half-1] ?? 0) + (sortedArray[half] ?? 0))/2;
};

export { toHexString, toBuffer, pkToKey, skToKey, keyToPk, keyToSk, median }