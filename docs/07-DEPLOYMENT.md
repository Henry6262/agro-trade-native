# 07 — Deployment

> Railway (backend), EAS (mobile), Vercel (landing), Celo (contracts).
> Exact commands for every deploy target.

---

## Overview

| Target | Service | Status |
|--------|---------|--------|
| Backend API | Railway | ✅ Live |
| Mobile iOS | EAS + TestFlight | ⏳ Needs build |
| Mobile Android | EAS + Play Store | 🔴 Gradle error blocks |
| Landing page | Vercel (recommended) | ⏳ Not deployed |
| Smart contract | Celo Sepolia | 🔴 Needs funded wallet |

---

## 1. Backend — Railway

### Live Service
```
URL:          https://agro-trade-native-production.up.railway.app
Service ID:   c6c66318-0db4-4984-8948-a2fa524db88e
Project ID:   a06c2f93-5116-43db-acf2-9cfc3892ee93
Env ID:       d578a08f-3626-45f5-abfe-6ec25a572ef6
GitHub repo:  Henry6262/agro-trade-native
Branch:       main (auto-deploy on push)
```

### Railway Config
```yaml
rootDirectory:  /backend
Builder:        DOCKERFILE
startCommand:   sh -c 'npx prisma migrate deploy && node --unhandled-rejections=strict /app/dist/main.js 2>&1'
```

### Environment Variables (all required)
```bash
DATABASE_URL=postgresql://...?connect_timeout=5&pool_timeout=5
PRIVY_APP_ID=cmieakfr201g9jo0cwewfvsgi
PRIVY_APP_SECRET=<secret>
NODE_ENV=production

# Blockchain (set AFTER contract deployment)
ESCROW_CONTRACT_ADDRESS=<deployed address>
BLOCKCHAIN_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
ADMIN_WALLET_PRIVATE_KEY=<private key — never commit>
ADMIN_WALLET_ADDRESS=<public address>
CUSD_TOKEN_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1

# DO NOT SET:
# PORT — Railway injects this dynamically (auto = 8080)
```

### ⚠️ Critical Railway Rules
1. **Never set `PORT`** — Railway assigns it. If you set it to 3000 but Railway uses 8080 → 502.
2. **Never use `exec node`** — breaks Railway process tracking → 502. Use `sh -c '... node 2>&1'`.
3. **`DATABASE_URL` must have timeouts** — `?connect_timeout=5&pool_timeout=5` prevents silent startup hangs.
4. **`2>&1` in startCommand** — makes stderr visible in `railway logs`.
5. **`deploymentRedeploy` mutation uses cached config** — only git pushes pick up new service config.

### Deploying to Railway
```bash
# Auto-deploy: just push to main
git push origin main

# Manual deploy via CLI
railway link
railway up

# View logs
railway logs --lines 200

# Restart service
railway restart
```

---

## 2. Smart Contract — Celo

### ⏳ Deploy AgroEscrow.sol to Celo Sepolia (Required for Escrow Features)

```bash
# Step 1: Fund your admin wallet
# Go to: https://faucet.celo.org
# Enter admin wallet address
# Get testnet CELO

# Step 2: Deploy
cd contracts

PRIVATE_KEY=<admin_private_key> \
CUSD_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1 \
forge script script/Deploy.s.sol:DeployAgroEscrow \
  --rpc-url https://forno.celo-sepolia.celo-testnet.org \
  --broadcast

# Step 3: From the output, copy the deployed contract address
# Looks like: "Contract deployed at: 0x..."

# Step 4: Set ESCROW_CONTRACT_ADDRESS in Railway
# (see Railway env vars above)
```

### Verify Deployment
```bash
# Check contract is live
cast call <CONTRACT_ADDRESS> "getEscrow(bytes32)" 0x0000000000000000000000000000000000000000000000000000000000000000 \
  --rpc-url https://forno.celo-sepolia.celo-testnet.org
```

### Mainnet (future)
```bash
PRIVATE_KEY=<key> \
CUSD_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a \
forge script script/Deploy.s.sol:DeployAgroEscrow \
  --rpc-url https://forno.celo.org \
  --broadcast \
  --verify
```

---

## 3. Mobile App — EAS (Expo Application Services)

### Setup (first time)
```bash
cd front-end
npm install -g eas-cli
eas login
eas build:configure   # creates eas.json if missing
```

### iOS Build
```bash
# Development build (for testing on device)
eas build --platform ios --profile development

# Production build (for App Store / TestFlight)
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios
```

### Android Build
```bash
# Development build — add --clear-cache to fix Gradle errors
eas build --platform android --profile development --clear-cache

# Production build
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

### eas.json (profiles)
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### expo-build-properties (current working version)
```json
["expo-build-properties", {
  "android": {
    "compileSdkVersion": 35,
    "targetSdkVersion": 35,
    "buildToolsVersion": "35.0.0",
    "kotlinVersion": "1.9.25"
  },
  "ios": { "deploymentTarget": "15.1" }
}]
```

---

## 4. Landing Page — Vercel

### First Deploy
```bash
cd landing
npm run build          # ensure it builds cleanly first

npx vercel login
npx vercel link        # link to Vercel project
npx vercel env pull    # pull env vars to .env.local (if project exists)
npx vercel deploy --prod
```

### Environment Variables (set in Vercel dashboard)
```bash
NEXT_PUBLIC_API_URL=https://agro-trade-native-production.up.railway.app/api
NEXT_PUBLIC_PRIVY_APP_ID=cmieakfr201g9jo0cwewfvsgi
NEXT_PUBLIC_WS_URL=https://agro-trade-native-production.up.railway.app
```

### Auto-deploy setup
1. Connect GitHub repo in Vercel dashboard
2. Set `Root Directory` to `landing`
3. Every push to `main` deploys automatically

---

## 5. Local Development

### Backend
```bash
cd backend
cp .env.example .env   # fill in your local values
npm install
npx prisma migrate dev
npm run start:dev      # port 4000
```

### Mobile App
```bash
cd front-end
npm install
npx expo start --ios   # or --android
```

Update `src/config/index.ts` to use your machine's LAN IP:
```typescript
API_BASE_URL: 'http://192.168.X.X:4000/api'  // NOT localhost
```

### Landing Page
```bash
cd landing
npm install
npm run dev    # starts on available port (3000 or next free)
```

### Contracts
```bash
cd contracts
anvil --chain-id 44787     # local Celo-compatible devnet
# Deploy locally:
PRIVATE_KEY=0xac0974...    # anvil default key
CUSD_ADDRESS=<deploy mock ERC20>
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

---

## Release Checklist

Work through these in order:

- [ ] **1.** Fund admin wallet at https://faucet.celo.org
- [ ] **2.** Deploy `AgroEscrow.sol` to Celo Sepolia — `forge script ... --broadcast`
- [ ] **3.** Copy deployed contract address
- [ ] **4.** Set all 5 blockchain env vars in Railway
- [ ] **5.** Railway auto-redeploys — verify `railway logs` shows escrow module initialized
- [ ] **6.** Test escrow flow: create trade → advance to IN_TRANSIT → check `EscrowStatusCard` shows locked state
- [ ] **7.** Deploy landing page to Vercel — `vercel deploy --prod`
- [ ] **8.** iOS: `eas build --platform ios --profile production` → submit to TestFlight
- [ ] **9.** Android: `eas build --platform android --profile production --clear-cache`
- [ ] **10.** Smoke test all 4 roles end-to-end on TestFlight build
