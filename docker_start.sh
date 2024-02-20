#!/bin/bash
# Start script for account-validator-web
# Install specific version only for local docker
npm i @swc/core-linux-arm64-gnu
PORT=3000
export NODE_PORT=${PORT}
exec npm run dev -- ${PORT}