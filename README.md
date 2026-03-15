<div align="center">
    <img src="assets/icon.svg" width=200 height=200>
    <h1>BitClock</h1>
</div>

BitClock is a ledger-free distributed timestamp system. You can issue timestamps without relying on centralized servers or large-scale blockchains. By each node generate and share stamps and compile them as proof, we can verify the order in which the data was generated.

[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

> [!NOTE]
> BitClock is currently in active development. The API and features may change without notice.

## :sparkles: Features
- :mantelpiece_clock: Distributed timestamp without ledger - We can verify timestamp without global ledgers or blockchains.

## :books: Documents
- [About the algorithm (Not finished yet)](docs/algorithm.md)

## :rocket: Set up
```bash
# Clone the repository (or Download ZIP)
git clone https://github.com/kotagit75/bitclock.git

# Navigate to the project directory
cd bitclock

# Install packages
npm install
```

## :gear: Usage
```bash
# run
$ npm start

# get status
$ curl http://localhost:8080/status

# get address
$ curl http://localhost:8080/address

# get pool
$ curl http://localhost:8080/pool

# get peers
$ curl http://localhost:8080/peers

# add peer
$ curl -X POST -H "Content-Type: application/json" -d '{"url":"http://[peerIP]:3000/"}' http://localhost:8080/addPeer

# proof
$ curl -X POST -H "Content-Type: application/json" -d '{"data":"Some data"}' http://localhost:8080/proof

# help
$ npm start -- --help
Usage: main [options]

Options:
  -l, --minLogLevel <optionValue>  set minLogLevel (default: "INFO")
  -h, --help                       display help for command
```

## :jigsaw: APIs

| status | method | endpoint | feature |
| ---- | ---- | ---- | ---- |
| <ul><li> [x] </ul> | `GET` | /status | get status |
| <ul><li> [x] </ul> | `GET` | /address | get address |
| <ul><li> [x] </ul> | `GET` | /pool | get proof pool |
| <ul><li> [x] </ul> | `GET` | /peers | get peers |
| <ul><li> [x] </ul> | `POST` | /addPeer | add peer |
| <ul><li> [x] </ul> | `POST` | /proof | create a proof |

## :ticket: License
[BitClock is under the MIT License.](LICENSE)