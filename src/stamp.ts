import { broadcastResponceStamp } from "./p2p"
import { createStamp } from "./proof/node"

type unStamped = {
    pk: string,
    difficulty: number,
    index: number
}
const unStampedPool: unStamped[] = []

const issueAndBroadcastStamp = (pk: string, difficulty: number, index: number) => {
    const stamp = createStamp(pk, difficulty, index)
    broadcastResponceStamp(pk, stamp)
}
const initIssueStamp = () => {
    const cycle = () => {
        const unStamped = unStampedPool.pop()
        if(unStamped){
            issueAndBroadcastStamp(unStamped.pk, unStamped.difficulty, unStamped.index)
        }
        setTimeout(cycle, 10)
    }
    setTimeout(cycle, 10)
}
const addUnStampedPool = (pk: string, difficulty: number, index: number) => {
    unStampedPool.push({pk, difficulty, index})
}

export { initIssueStamp, addUnStampedPool }