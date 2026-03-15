import express from "express";
import cors from "cors";

import { addPeer, broadcastUpdateProofPool } from "./p2p";
import { addProof, createProof, getProofPool, getAddress } from "./proof/node";
import { logger } from "./logger";
import { exportProofPool } from "./parse";
import { getStatus } from "./util";

export const initAPIServer = () => {
    const PORT = 8080
    const app = express()
    
    app.use(cors())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    
    app.use((req, res, next) => {
        logger.debug("API", `Received request:`, req.url)
        next()
    })

    app.get("/status", (req, res) => {
        res.send(getStatus())
    })
    app.get("/address", (req, res) => {
        res.send(getAddress())
    })
    app.get("/getPool", (req, res) => {
        res.send(exportProofPool(getProofPool()))
    })
    app.post("/addPeer", (req, res) => {
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
            res.send({"result": "Creating proof"});
            logger.info("API", "Creating proof. Source:", JSON.stringify(req.body));
            var proof = await createProof(data)
            var result = await addProof(proof)
            if (result){
                logger.info("API", "Creating proof was successful.")
                broadcastUpdateProofPool(getProofPool())
            }
            else{
                logger.error("API", "Creating proof was failed. Source:", JSON.stringify(req.body))
            }
        }else{
            res.send({"result": "faild: data is undefined"})
        }
    })

    return app.listen(PORT, () => {
        logger.info("API", `API server is running on http://localhost:${PORT}`)
    })
}