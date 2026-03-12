<div align="center">
    <img src="assets/icon.svg" width=200 height=200>
    <h1>Bit:Clock</h1>
</div>

Bit:Clock is a ledger-free distributed timestamp system.

[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

> [!NOTE]
> Bit:Clock is currently in active development.

## Documents
[About the algorithm](docs/algorithm.md)
## :rocket: Set up
```bash
# Clone the repository (or Download ZIP)
git clone https://github.com/kotagit75/Bit-Clock.git

# Navigate to the project directory
cd Bit-Clock

# Install packages
npm install
```

## :gear: Usage
```bash
# run
npm start

# proof
curl -X POST -H "Content-Type: application/json" -d '{"data":"Some data"}' localhost:8080/proof

# get pool
curl http://localhost:8080/getPool

# get address
curl http://localhost:8080/address

# get status
curl http://localhost:8080/status
```

## License
[Bit:Clock is under the MIT License.](LICENSE)