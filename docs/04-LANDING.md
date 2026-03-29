# 04 — Web Portal (landing/)

> Next.js 16 app serving both the public marketing page and the web-based role dashboard.

**Location:** `landing/`
**Framework:** Next.js 16.1.6 (App Router)
**Styling:** Tailwind CSS v4 + shadcn/ui
**Auth:** `@privy-io/react-auth`
**State:** Zustand stores
**Build:** Clean — 23 static + 2 dynamic routes, zero errors

---

## Two Purposes in One App

```
landing/
├── app/page.tsx                    → Public landing page (marketing)
├── app/auth/login/page.tsx         → Login with Privy
└── app/dashboard/                  → Authenticated web dashboard
    ├── layout.tsx                      shared sidebar + topbar
    ├── page.tsx                        redirect to role-specific dashboard
    ├── buyer/page.tsx                  buyer overview
    ├── seller/page.tsx                 seller overview
    ├── inspector/page.tsx              inspector overview
    ├── transporter/page.tsx            transporter overview
    ├── admin/page.tsx                  admin overview
    │   ├── escrow/page.tsx             escrow management
    │   ├── operations/page.tsx         all trade operations
    │   └── users/page.tsx              user management
    ├── buyer/marketplace/page.tsx      marketplace browsing
    ├── buyer/orders/page.tsx           order list
    ├── buyer/orders/[id]/page.tsx      order detail (dynamic)
    ├── seller/listings/page.tsx        my listings
    ├── seller/listings/new/page.tsx    create listing
    ├── seller/offers/page.tsx          offers received
    ├── seller/trades/page.tsx          active trades
    └── settings/page.tsx              account settings
```

---

## Landing Page Sections

Public page at `/` assembled from components in `app/components/sections/`:

| Section | Component | Content |
|---------|-----------|---------|
| Navigation | `Navbar.tsx` | Logo, nav links, "Join Waitlist" CTA |
| Hero | `Hero.tsx` | Headline, subtext, stats counter, CTAs |
| Problem | `ProblemSection.tsx` | Before/After comparison — $40B problem |
| How It Works | `HowItWorks.tsx` | 4-step escrow flow |
| Ecosystem | `EcosystemSection.tsx` | Platform roles diagram (Buyer/Seller/Inspector/Logistics) |
| App Preview | `AppShowcase.tsx` | Mobile app screenshots / device mockups |
| Hero Screens | `HeroScreens.tsx` | Dashboard screen previews |
| Roles | `RolesSection.tsx` | Detailed role cards |
| Global Reach | `GlobalReach.tsx` | Trade corridor map (Balkans → ME → Asia) |
| Live Deal Flow | `LiveDealFlow.tsx` | Animated trade activity feed |
| Vault | `VaultSection.tsx` | Escrow/security explanation |
| CTA Footer | `CtaFooter.tsx` | Final conversion + waitlist form |

---

## Dashboard Components

Shared across all role dashboards in `app/components/dashboard/`:

| Component | Purpose |
|-----------|---------|
| `AppSidebar.tsx` | Left nav — role-color-coded, Leaf icon logo |
| `DashboardTopbar.tsx` | Top bar — notifications bell, user avatar |
| `EscrowStatusCard.tsx` | Escrow state display with Release/Dispute actions |
| `OrderTimeline.tsx` | Trade phase timeline component |
| `TradeRequestDialog.tsx` | Modal for creating trade requests |

---

## Brand & Design System

**Primary color:** Forest Green (`#3D7A50`) with emerald/teal/lime variants

Color palette defined in `app/components/brand.ts`:
```typescript
brand: {
  primary: '#3D7A50',     // Forest Green
  medium:  '#10b981',     // Emerald-500
  bright:  '#34d399',     // Emerald-400
  extra:   '#6ee7b7',     // Emerald-300 (light)
}
```

Role colors (applied to sidebar icon backgrounds):
- Buyer → `emerald`
- Seller → `green`
- Inspector → `teal`
- Transporter → `lime`
- Admin → `green`

---

## Route Map (All 25 Pages)

```
○ /                                → Landing page (static)
○ /_not-found                      → 404 page (static)
ƒ /api/waitlist                    → Waitlist signup (dynamic, server)
○ /auth/login                      → Privy login (static shell)
○ /dashboard                       → Redirect to role dashboard (static)
○ /dashboard/admin                 → Admin overview
○ /dashboard/admin/escrow          → Escrow management table
○ /dashboard/admin/operations      → All trade operations
○ /dashboard/admin/users           → User management
○ /dashboard/buyer                 → Buyer overview
○ /dashboard/buyer/marketplace     → Browse listings
○ /dashboard/buyer/orders          → Order list
ƒ /dashboard/buyer/orders/[id]     → Order detail (dynamic)
○ /dashboard/inspector             → Inspector overview
○ /dashboard/seller                → Seller overview
○ /dashboard/seller/listings       → My listings
○ /dashboard/seller/listings/new   → Create listing
○ /dashboard/seller/offers         → Offers received
○ /dashboard/seller/trades         → Active trades
○ /dashboard/settings              → Account settings
○ /dashboard/transporter           → Transporter overview
○ /manifest.webmanifest            → PWA manifest
○ /robots.txt                      → SEO robots
○ /sitemap.xml                     → SEO sitemap

○ = Static (prerendered at build)
ƒ = Dynamic (server-rendered on demand)
```

---

## next.config.ts

```typescript
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),   // fixes false monorepo detection
  },
};

export default nextConfig;
```

**Why `turbopack.root`?** The parent directory has its own `package-lock.json`, which Next.js 16 detects and misinterprets as a monorepo root. Setting `root` to `__dirname` corrects this.

---

## Dev Server — Known Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Dev server crashes (WASM binding) | Next.js 16 uses Turbopack dev server; `next-swc-fallback/` dir missing | `turbopack.root` config applied |
| Port 3000 conflict | Another process owns port 3000 | `launch.json` uses `autoPort: true` |
| Non-standard NODE_ENV warning | Parent env leaks `NODE_ENV` | Cosmetic warning only, safe to ignore |

**For local dev:**
```bash
cd landing
npm run dev      # starts on first available port (Webpack, stable)
```

**For Claude Preview (automated):**
- `launch.json` uses `npm run start` (serves built output)
- Always run `npm run build` first if you've made changes

---

## Build & Start Commands

```bash
cd landing

npm run build         # production build → .next/
npm run start         # serve built output (PORT from env, defaults 3000)
npm run dev           # development server with hot reload
```

---

## Environment Variables

```bash
# landing/.env.local
NEXT_PUBLIC_API_URL=https://agro-trade-native-production.up.railway.app/api
NEXT_PUBLIC_PRIVY_APP_ID=cmieakfr201g9jo0cwewfvsgi
NEXT_PUBLIC_WS_URL=https://agro-trade-native-production.up.railway.app
```

---

## Deployment

Currently not deployed to Vercel — served locally or from Railway.

**To deploy to Vercel:**
```bash
cd landing
npx vercel deploy --prod
```

Vercel auto-detects Next.js, zero-config deployment. Set env vars in Vercel dashboard.
