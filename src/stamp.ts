import { broadcastResponceStamp } from "./p2p"
import { createStamp } from "./proof/node"

type unStamped = {
    pk: string,
    difficulty: number
}
const unStampedPool: unStamped[] = []

const issueAndBroadcastStamp = (pk: string, difficulty: number) => {
    const stamp = createStamp(pk, difficulty)
    broadcastResponceStamp(pk, stamp)
}
const initIssueStamp = () => {
    setInterval(()=> {
        const unStamped = unStampedPool.pop()
        if(!unStamped){
            return
        }
        issueAndBroadcastStamp(unStamped.pk, unStamped.difficulty)
    }, 100)
}
const addUnStampedPool = (pk: string, difficulty: number) => {
    unStampedPool.push({pk, difficulty})
}

export { initIssueStamp, addUnStampedPool }