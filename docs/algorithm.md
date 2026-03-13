# Algorithm

## System Configuration
A node has the following four states:
- RSA key
- address (public key)
- counter
- proof pool

This system handles the following two types of structures:
- stamp
- proof
## Stamp
A stamp is a timestamp issued by a node.
```
Stamp = {
    address: issuing node
    count: issuing node's counter value
    public key: Proof public key
    nonce: poW nonce
    sign: issuing node's signature
}
```