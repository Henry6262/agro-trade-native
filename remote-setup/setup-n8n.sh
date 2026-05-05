#!/bin/bash
# Run this on your PC BUILD
set -e

if ! which n8n >/dev/null 2>&1; then
    echo "Installing n8n..."
    npm install -g n8n
fi

echo "Starting n8n..."
echo "Open http://localhost:5678 in your browser"
n8n start
