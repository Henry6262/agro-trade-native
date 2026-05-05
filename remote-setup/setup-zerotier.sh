#!/bin/bash
# RUN THIS ON YOUR PC BUILD (and laptop) as Tailscale alternative
# ZeroTier = same mesh VPN, no GUI app bundle headaches

set -e

echo "🌐 Installing ZeroTier..."

# Install (works on macOS, Linux, etc.)
if ! which zerotier-cli >/dev/null 2>&1; then
    curl -s https://install.zerotier.com | sudo bash
fi

echo ""
echo "=== ZeroTier installed ==="
echo "Your ZeroTier address: $(sudo zerotier-cli info | awk '{print $3}')"
echo ""
echo "NEXT STEPS:"
echo "1. Create a free account at https://my.zerotier.com"
echo "2. Create a Network → copy the 16-digit Network ID"
echo "3. On BOTH machines, run:"
echo "   sudo zerotier-cli join <your-network-id>"
echo "4. In the web dashboard, authorize both devices (check the checkbox)"
echo "5. Both machines will get IPs like 192.168.x.x or 10.x.x.x"
echo ""
echo "Then test: ping <other-machine-zerotier-ip>"
echo "And SSH:  ssh user@<other-machine-zerotier-ip>"
