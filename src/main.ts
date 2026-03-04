import express from "express";
import cors from "cors";

import { addPeer, broadcastUpdateProofPool, initP2PServer } from "./p2p";
import { addProof, createProof, getProofPool, initWallet, getAddress } from "./proof/wallet";
import { logger } from "./logger";
import { exportProof, exportProofPool } from "./parse";

const init = () => {
    initWallet()
    initP2PServer()
    initHTTPServer()
}
const initHTTPServer = () => {
    const PORT = 8080
    const app = express()
    
    app.use(cors())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    
    app.use((req, res, next) => {
        logger.debug("HttpServer", `Received request:`, req.url)
        next()
    })

    app.get("/status", (req, res) => {
        res.send("running")
    })
    app.get("/address", (req, res) => {
        res.send(getAddress())
    })
    app.get("/getPool", (req, res) => {
        res.send(exportProofPool(getProofPool()))
    })
    app.get("/addPeer", (req, res) => {
        var url = req.body.url
        if(url != undefined){
            if(URL.canParse(url)){
                addPeer(new URL(url))
            }else{
                res.send({"result": "faild to parse"})
            }
        }else{
            res.send({"result": "faild: data is undefined"})
        }
    })
    // curl -X POST -H "Content-Type: application/json" -d '{"data":"Hello world!"}' localhost:8080/proof
    app.post("/proof", async (req, res) => {
        res.setHeader("Content-Type", "application/json")
        var data = req.body.data
        if (data != undefined){
            logger.info("HttpServer", "Creating proof. Source:", JSON.stringify(req.body))
            var proof = await createProof(data)
            var result = await addProof(proof)
            if (result){
                logger.info("HttpServer", "Creating proof was successful.")
                broadcastUpdateProofPool(getProofPool())
                res.send(exportProof(proof))
            }
            else{
                logger.info("HttpServer", "Creating proof was failed. Source:", JSON.stringify(req.body))
                res.send({"result": "faild"})
            }
        }else{
            res.send({"result": "faild: data is undefined"})
        }
    })

    app.listen(PORT, () => {
        logger.info("HttpServer", `Http server is running on http://localhost:${PORT}`)
    })
}
logger.info("Main", "Starting Bit:Clock.")
init()

// const test = () => {
//     const message = new Message("REQUEST_STAMP", "STAMP_DATA")
//     console.log("raw message:", message)
//     const exported = exportMessage(message)
//     console.log("exported message:", exported)
//     const imported = importMessage(exported)
//     console.log("imported message:", imported)
// }
// test()