import { logger } from "./logger"
import { initP2PServer } from "./p2p"
import { initNode } from "./proof/node"
import { initAPIServer } from "./api"
import { program } from "commander"
import { initIssueStamp } from "./stamp"

BigInt.prototype.toJSON = function() { return this.toString(); }

program.option('-l, --minLogLevel <optionValue>', 'set minLogLevel', 'INFO')
program.parse()
const options = program.opts()
if(options.minLogLevel)logger.setMinShowLogLevel(options.minLogLevel)

const init = () => {
    logger.info("SYS", "Initializing BitClock")
    initNode()
    initIssueStamp()
    const p2pServer = initP2PServer()
    const apiServer = initAPIServer()
}
init()
