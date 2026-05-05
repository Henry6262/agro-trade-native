# Remote Workstation Setup

## Architecture
```
Your Laptop/Phone → Tailscale VPN → PC Build (Home)
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
              Parsec (GUI)         SSH (CLI)
                    ↓                   ↓
                 Xcode          xcodebuild, bots
```

## Phase 1: Network (Do This First)

### On BOTH machines (laptop + PC build):

1. **Install Tailscale** (GUI app, requires manual install)
   - Download: https://pkgs.tailscale.com/stable/Tailscale-1.82.5-macos.zip
   - Unzip → Drag to Applications
   - Launch → Sign in with Google/Apple/Microsoft
   - Both machines will get IPs like `100.x.x.x`

2. **Verify connection**
   ```bash
   tailscale status
   # Should see both machines listed
   ```

3. **Test SSH from laptop to PC build**
   ```bash
   ssh username@<pc-build-tailscale-ip>
   ```

## Phase 2: Visual Remote Desktop

### On PC Build:
1. **Install Parsec** (best for low-latency Xcode)
   - Download: https://parsec.app/downloads
   - Create account, host from PC build
   - Connect from laptop

### Alternative: Built-in Screen Sharing
- System Settings → General → Sharing → Screen Sharing → ON
- From laptop: `open vnc://<pc-build-tailscale-ip>`

## Phase 3: Keep PC Build Awake

The `setup-awake.sh` script in this folder configures your PC build
to never sleep while plugged in. Run it on your PC build.

## Phase 4: Automation / "Message My PC"

### Option A: Telegram Bot (Simple Commands)
1. Message @BotFather on Telegram, create a bot, get token
2. Edit `telegram-bot/.env` with your token
3. Run `node telegram-bot/bot.js` on your PC build
4. Message your bot commands like `/build` or `/status`

### Option B: n8n (Visual Workflows)
1. Run `./setup-n8n.sh` on your PC build
2. Open http://localhost:5678
3. Create workflows that receive webhooks from Telegram/HTTP
   and execute shell commands on your machine

### Option C: Open Interpreter (AI Agent)
1. Install: `pip install open-interpreter`
2. Run: `interpreter --os`
3. The AI can see your screen and click things

## Quick Test Checklist
- [ ] Both machines show in `tailscale status`
- [ ] Can SSH from laptop to PC build
- [ ] Can see PC build screen via Parsec/Screen Sharing
- [ ] PC build stays awake when plugged in
- [ ] Telegram bot responds to `/ping`
