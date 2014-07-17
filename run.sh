#!/bin/bash

ulimit -n 10240
while true; do
  node index.js > server.log 2>&1

  sleep 5
done
