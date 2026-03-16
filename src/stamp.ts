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
    setInterval(()=> {
        const unStamped = unStampedPool.pop()
        if(!unStamped){
            return
        }
        issueAndBroadcastStamp(unStamped.pk, unStamped.difficulty, unStamped.index)
    }, 100)
}
const addUnStampedPool = (pk: string, difficulty: number, index: number) => {
    unStampedPool.push({pk, difficulty, index})
}

export { initIssueStamp, addUnStampedPool }