#!/bin/bash

sendData='{"data":"${1}"}'
echo $sendData
# curl -X POST -H "Content-Type: application/json" -d '{"data":"${1}"}' localhost:8080/proof
# curl -X POST -H "Content-Type: application/json" -d '{"data":"Hello world!"}' localhost:8080/proof