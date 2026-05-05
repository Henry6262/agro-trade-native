#!/bin/bash
# Run this on your PC BUILD to keep it awake for remote access
set -e

PLIST_PATH="$HOME/Library/LaunchAgents/com.remote-workstation.stay-awake.plist"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST_PATH" << 'PLIST'
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
    <key>StandardOutPath</key>
    <string>/tmp/caffeinate.out</string>
    <key>StandardErrorPath</key>
    <string>/tmp/caffeinate.err</string>
</dict>
</plist>
PLIST

launchctl load "$PLIST_PATH" 2>/dev/null || true
echo "Stay-awake daemon installed."
echo "PC build will never sleep while plugged in."
echo "To stop: launchctl unload $PLIST_PATH"
