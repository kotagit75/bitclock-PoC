import crypto from "crypto"

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  base = base % mod
  let result = 1n

  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod
    }

    base = (base * base) % mod
    exp = exp / 2n
  }

  return result
}

export function computeVDF(x: bigint, t: number, N: bigint): bigint {
  let y = x

  for (let i = 0; i < t; i++) {
    y = (y * y) % N
  }

  return y
}

function hashToPrime(x: bigint, y: bigint): bigint {
  const hash = crypto
    .createHash("sha256")
    .update(x.toString() + y.toString())
    .digest("hex")

  return (BigInt("0x" + hash) % 1000003n) + 2n
}

export type VDFProof = {
  pi: bigint
  l: bigint
  y: bigint
}
export const initVDFResult: VDFProof = { pi: BigInt(0) , l: BigInt(0), y: BigInt(0)}

export function createVDFProof(
  x: bigint,
  y: bigint,
  t: number,
  N: bigint
): VDFProof {
  const l = hashToPrime(x, y)

  const twoPowT = 1n << BigInt(t)

  const q = twoPowT / l

  const pi = modPow(x, q, N)

  return { pi, l, y }
}

export function verifyVDF(
  x: bigint,
  proof: VDFProof,
  t: number,
  N: bigint
): boolean {
  const { pi, l, y } = proof

  const twoPowT = 1n << BigInt(t)
  const r = twoPowT % l

  const left =
    (modPow(pi, l, N) * modPow(x, r, N)) % N

  return left === y
}