import express from "express";
import cors from "cors";
import { createStamp, updateProofPool } from "./proof/node";
import { MIN_NUMBER_OF_STAMPS, Stamp, type Proof } from "./proof/proof";
import { URL } from "url";
import { logger } from "./logger";
import { exportMessage, exportProofPool, exportStamp, importMessage, importProofPool, importStamp } from "./parse";
import { sleep } from "./util";
import { addUnStampedPool } from "./stamp";

var peers: Set<URL>

const stampPool:  Map<string, Stamp[]> = new Map()

type MessageType = "NONE" | "REQUEST_STAMP" | "RESPONCE_STAMP" | "UPDATE_PROOFPOOL"
export class Message{
    constructor(public type: MessageType, public data: string, public data2: string){}
}
const initP2PServer = () => {
    const app = express()
    const PORT = 3000

    peers = new Set()
    addPeer(new URL(`http://localhost:${PORT}/`))

    app.use(cors())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    app.post("/", (req, res) => {
        var message: Message|undefined = importMessage(JSON.stringify(req.body))
        if(!message){
            res.send("cannot parse request data as message")
            return
        }
        logger.debug("P2P", "Got a message: ", JSON.stringify(message))
        switch (message.type) {
            case "NONE":
                break
            case "REQUEST_STAMP":
                const pk = message.data
                const difficulty: number = Number(message.data2)
                if(!pk || difficulty == undefined) {
                    res.send({"result": "fail"})
                    break
                }
                for (let i = 0; i < MIN_NUMBER_OF_STAMPS; i++) {
                    addUnStampedPool(pk, difficulty, i)
                }
                res.send({"result": "creating"})
                break
            case "RESPONCE_STAMP":
                const pk_ = message.data
                var stamp = importStamp(message.data2)
                if(!stamp) {
                    break
                }
                const stamps = stampPool.get(pk_)
                if(!stamps){
                    stampPool.set(pk_, [stamp])
                }else{
                    stampPool.set(pk_, stamps.concat(stamp))
                }
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
    return app.listen(PORT, () => {
        logger.info("P2P", `P2P server is running on http://localhost:${PORT}`)
    })
}

const write = async (peer: URL, message: Message): Promise<string|undefined> => {
    try {
        const responce = await fetch(peer, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(exportMessage(message))
        })
        return responce.text()
    } catch (err) {
        return undefined
    }
}
const broadcast = async (message: Message): Promise<(string|undefined)[]> => {
    var responces:(string|undefined)[]  = []
    for(const peer of peers) {
        responces.push(await write(peer, message))
    }
    return responces
}
const broadcastRequestStamps = async (pk: string, difficulty: number): Promise<void> => {
    await broadcast(new Message("REQUEST_STAMP", pk, String(difficulty)))
}
const broadcastAndGetRequestStamps = async (pk: string, difficulty: number): Promise<Stamp[]> => {
    await broadcastRequestStamps(pk, difficulty)
    var resStamps: Stamp[]|undefined = stampPool.get(pk)
    
    const stampsLen = () => resStamps?resStamps.length:0
    
    const sleepTime = 100
    const timeout = sleepTime*1000
    var waitTime = 0
    
    while (stampsLen() < MIN_NUMBER_OF_STAMPS) {
        await sleep(sleepTime);
        resStamps = stampPool.get(pk)
        waitTime+=sleepTime
        if(waitTime > timeout){
            break
        }
    }
    stampPool.set(pk, [])
    if(!resStamps){
        return []
    }
    return resStamps
}
const broadcastResponceStamp = async (pk: string, stamp: Stamp): Promise<void> => {
    await broadcast(new Message("RESPONCE_STAMP", pk, JSON.stringify(exportStamp(stamp))))
}
const broadcastUpdateProofPool = async (proofPool: Set<Proof>): Promise<void> => {
    await broadcast(new Message("UPDATE_PROOFPOOL", JSON.stringify(exportProofPool(proofPool)), ""))
}

const addPeer = (newPeer: URL) => {
    peers.add(newPeer)
}
const getPeers = (): URL[] => {
    return Array.from(peers)
}

export { initP2PServer, peers, broadcastRequestStamps, broadcastAndGetRequestStamps, broadcastUpdateProofPool, broadcastResponceStamp, addPeer, getPeers }