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

    process.on('SIGINT', ()=>{
        p2pServer.close(()=>{
            logger.info("SYS", "P2P server was closed")
        })
        apiServer.close(()=>{
            logger.info("SYS", "API server was closed")
        })
    })
    process.on('exit', () => {
        logger.info("SYS", "BitClock is closing")
    })
}
init()
