import express from "express";
import cors from "cors";

import { addPeer, broadcastUpdateProofPool } from "./p2p";
import { addProof, createProof, getProofPool, getAddress } from "./proof/node";
import { logger } from "./logger";
import { exportProofPool } from "./parse";

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
        res.send("running")
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
    app.post("/proof", (req, res) => {
        res.setHeader("Content-Type", "application/json")
        var data = req.body.data
        if (data != undefined){
            (async () => {
                var proof = await createProof(data)
                var result = await addProof(proof)
                if (result){
                    logger.info("API", "Creating proof was successful.")
                    broadcastUpdateProofPool(getProofPool())
                }
                else{
                    logger.error("API", "Creating proof was failed. Source:", JSON.stringify(req.body))
                }
            })()
            logger.info("API", "Creating proof. Source:", JSON.stringify(req.body))
            res.send({"result": "Creating proof"})
        }else{
            res.send({"result": "faild: data is undefined"})
        }
    })

    app.listen(PORT, () => {
        logger.info("API", `Http server is running on http://localhost:${PORT}`)
    })
}