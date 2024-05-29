#!/bin/bash
# Start script for account-validator-web

if [ ! -d "node_modules" ]; then
    echo "node_modules directory does not exist. Attempting to install dependencies..."
    if ! npm install; then
        echo "npm install failed or timed out. Please run 'npm install' in the account-validator-web directory manually before starting the service."
        exit 1
    fi
fi

echo "Starting the account-validator-web service..."
npm run dev