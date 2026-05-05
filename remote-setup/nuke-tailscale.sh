#!/bin/bash
# RUN THIS ON YOUR PC BUILD to completely purge Tailscale
# Then reboot, then install fresh or switch to ZeroTier

echo "🧨 Nuking Tailscale from orbit..."

# 1. Quit Tailscale if running
sudo pkill -f tailscale 2>/dev/null || true
sudo pkill -f Tailscale 2>/dev/null || true
sleep 2

# 2. Remove app bundles
sudo rm -rf /Applications/Tailscale.app
sudo rm -rf /Applications/Tailscale*.app
sudo rm -rf ~/Applications/Tailscale*.app

# 3. Remove CLI binary
sudo rm -f /usr/local/bin/tailscale
sudo rm -f /opt/homebrew/bin/tailscale
sudo rm -f ~/.local/bin/tailscale

# 4. Remove system extensions (requires reboot to fully clear)
sudo rm -rf /Library/SystemExtensions/*tailscale* 2>/dev/null || true
sudo rm -rf /Library/LaunchDaemons/io.tailscale.ipn.macsys* 2>/dev/null || true

# 5. Remove user containers and prefs
sudo rm -rf ~/Library/Containers/io.tailscale.ipn.macos*
sudo rm -rf ~/Library/Containers/io.tailscale.ipn.macsys*
sudo rm -rf ~/Library/Group\ Containers/*.tailscale*
sudo rm -rf ~/Library/Application\ Support/Tailscale
sudo rm -rf ~/Library/Caches/Tailscale
sudo rm -rf ~/Library/Logs/Tailscale
sudo rm -rf ~/Library/Preferences/io.tailscale*.plist

# 6. Remove network preferences
sudo rm -f /Library/Preferences/SystemConfiguration/NetworkInterfaces.plist.bak* 2>/dev/null || true

# 7. Flush DNS
sudo dscacheutil -flushcache 2>/dev/null || true

echo ""
echo "✅ Tailscale purged."
echo ""
echo "NEXT: Reboot your PC build, then choose:"
echo "  A) Reinstall Tailscale fresh from App Store"
echo "  B) Switch to ZeroTier (simpler, CLI-only)"
echo ""
echo "ZeroTier install (no GUI app needed):"
echo "  curl -s https://install.zerotier.com | sudo bash"
echo "  sudo zerotier-cli join <network-id>"
