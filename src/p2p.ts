import express from "express";
import cors from "cors";
import { createStamp, updateProofPool } from "./proof/wallet";
import { Stamp, type Proof } from "./proof/proof";
import type { URL } from "url";
import { logger } from "./logger";
import { exportMessage, exportProofPool, exportStamp, importMessage, importProofPool, importStamp } from "./parse";

var peers: Set<URL>

type MessageType = "NONE" | "REQUEST_STAMP" | "UPDATE_PROOFPOOL"
export class Message{
    constructor(public type: MessageType, public data: string){}
}
const initP2PServer = () => {
    const app = express()
    const PORT = 3000
    app.use(cors())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    peers = new Set()
    app.get("/", (req, res) => {
        res.send("Hello P2P!")
    })
    app.get("/message", (req, res) => {
        var message: Message|undefined = importMessage(req.body)
        if(!message){
            res.send("cannot parse request data as message")
            return
        }
        logger.debug("P2P", "Got a message: ", message)
        switch (message.type) {
            case "NONE":
                break
            case "REQUEST_STAMP":
                var pk = message.data
                res.send(exportStamp(createStamp(pk)))
                break
            case "UPDATE_PROOFPOOL":
                var newProofPool = importProofPool(message.data)
                if(newProofPool){
                    updateProofPool(newProofPool)
                    res.send("ok")
                }else{
                    res.send("cannot parse request data as proof pool")
                }
                break
        }
    })
    app.listen(PORT, () => {
        logger.info("P2P", `P2P server is running on http://localhost:${PORT}`)
    })
}

const write = async (peer: URL, message: Message): Promise<string> => {
    const responce = await fetch(peer, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        body: exportMessage(message)
    })
    return responce.text()
}
const broadcast = async (message: Message): Promise<string[]> => {
    var responces:string[]  = []
    await peers.forEach(async (peer, _, __) => responces.push(await write(peer, message)))
    return responces
}
const broadcastRequestStamps = async (pk: string): Promise<Stamp[]> => {
    var responces = await broadcast(new Message("REQUEST_STAMP", pk))
    var stamps = responces.map((res, _, __) => importStamp(res)).filter((item) => item !== undefined)
    return stamps
}
const broadcastUpdateProofPool = async (proofPool: Set<Proof>): Promise<void> => {
    await broadcast(new Message("REQUEST_STAMP", exportProofPool(proofPool)))
}

const addPeer = (newPeer: URL) => {
    peers.add(newPeer)
}

export { initP2PServer, peers, broadcastRequestStamps, broadcastUpdateProofPool, addPeer }