import { logger } from "./logger"
import { initP2PServer } from "./p2p"
import { initNode } from "./proof/node"
import { initAPIServer } from "./api"

BigInt.prototype.toJSON = function() { return this.toString(); }

const init = () => {
    logger.info("SYS", "Initializing BitClock")
    initNode()
    const p2pServer = initP2PServer()
    const apiServer = initAPIServer()
}
init()
