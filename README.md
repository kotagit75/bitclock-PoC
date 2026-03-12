<div align="center">
    <img src="assets/icon.svg" width=200 height=200>
    <h1>Bit:Clock</h1>
</div>

Bit:Clock is a ledger-free distributed timestamp system.

[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)

> [!NOTE]
> Bit:Clock is currently in active development.

## Set up
```bash
# Clone the repository (or Download ZIP)
git clone https://github.com/kotagit75/Bit-Clock.git

# Navigate to the project directory
cd Bit-Clock

# Install packages
npm install
```

## Usage
**run**
```bash
npm start
```
**proof**
```bash
curl -X POST -H "Content-Type: application/json" -d '{"data":"Some data"}' localhost:8080/proof
```
**get pool**
```bash
curl http://localhost:8080/getPool
```
**get address**
```bash
curl http://localhost:8080/address
```
**get status**
```bash
curl http://localhost:8080/status
```

## License
[Bit:Clock is under the MIT License.](LICENSE)