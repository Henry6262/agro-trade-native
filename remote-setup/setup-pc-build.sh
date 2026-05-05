#!/bin/bash
# RUN THIS ON YOUR PC BUILD (the powerful Mac at home)
# Assumes Homebrew is already installed

set -e

echo "🖥 Setting up PC Build as remote workstation..."

# --- 1. TAILSCALE ---
if ! which tailscale >/dev/null 2>&1; then
    echo "Installing Tailscale..."
    brew install --cask tailscale
fi

echo "Starting Tailscale..."
# The macOS app needs to be launched manually once to grant VPN permissions
# After that, this CLI works:
sudo tailscale up --ssh --accept-routes

# --- 2. PARSEC (for low-latency screen sharing) ---
if ! ls /Applications/parsec.app >/dev/null 2>&1; then
    echo "Installing Parsec..."
    brew install --cask parsec
fi

# --- 3. SSH SERVER ---
echo "Ensuring SSH server is enabled..."
sudo systemsetup -setremotelogin on

# --- 4. KEEP AWAKE ---
echo "Installing stay-awake daemon..."
PLIST="$HOME/Library/LaunchAgents/com.remote-workstation.stay-awake.plist"
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.remote-workstation.stay-awake</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/caffeinate</string>
        <string>-i</string>
        <string>-s</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
PLIST
launchctl load "$PLIST" 2>/dev/null || true

# --- 5. TELEGRAM BOT ---
echo "Setting up Telegram bot..."
cd "$(dirname "$0")/telegram-bot"
npm install

echo ""
echo "============================================"
echo "✅ PC Build setup complete!"
echo ""
echo "NEXT STEPS:"
echo "1. Open Tailscale app → Sign in → both machines appear"
echo "2. Open Parsec app → Host this machine"
echo "3. Edit telegram-bot/.env with your BotFather token"
echo "4. Run: node telegram-bot/bot.js"
echo ""
echo "From your laptop:"
echo "  ssh $(whoami)@<pc-tailscale-ip>"
echo "  open -a Parsec  # and connect to your PC"
echo "============================================"
