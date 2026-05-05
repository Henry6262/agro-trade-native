#!/bin/bash
# Run this on BOTH machines (laptop + PC build)
set -e

KEY_NAME="remote-workstation"
KEY_PATH="$HOME/.ssh/$KEY_NAME"

if [ -f "$KEY_PATH" ]; then
    echo "Key already exists at $KEY_PATH"
else
    echo "Generating SSH key pair..."
    ssh-keygen -t ed25519 -C "remote-workstation-$(hostname)" -f "$KEY_PATH" -N ""
    echo "Key generated: $KEY_PATH"
fi

echo ""
echo "=== PUBLIC KEY (add this to ~/.ssh/authorized_keys on PC build) ==="
cat "$KEY_PATH.pub"
echo ""
echo "=== Add to PC build ==="
echo "ssh-copy-id -i $KEY_PATH.pub user@<pc-build-tailscale-ip>"
