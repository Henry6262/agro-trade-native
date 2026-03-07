# Dual Authentication + Bulgarian Localisation — Design Document

**Date:** 2026-03-07
**Status:** Approved
**Sprint:** Auth & i18n Sprint (post Sprint-1)

---

## Overview

Add phone-number OTP authentication (via Twilio) alongside the existing Privy wallet flow, and add Bulgarian language support for key screens using i18next + react-i18next.

Both auth methods produce the same JWT output. Language detection is automatic from device locale, with a manual toggle persisted to AsyncStorage.

---

## Section 1 — Dual Authentication

### User Experience

A new `AuthMethodSheet` screen replaces the current single-path login. It presents two equal glassmorphism tiles side by side:

```
┌─────────────────────────────────────┐
│         Welcome to AgroTrade        │
│                                     │
│  ┌──────────────┐  ┌─────────────┐  │
│  │  📱 Phone    │  │ 🔐 Wallet   │  │
│  │              │  │             │  │
│  │  No crypto   │  │  Privy      │  │
│  │  needed      │  │  wallet     │  │
│  └──────────────┘  └─────────────┘  │
└─────────────────────────────────────┘
```

Selecting **Phone** shows a two-step flow:
1. **Step 1 — Phone input**: Country code picker (defaulting to 🇧🇬 +359) + phone number field + "Send Code" button
2. **Step 2 — OTP input**: 6-digit code entry + 60-second resend countdown timer

Selecting **Wallet** continues to the existing Privy wallet flow unchanged.

Both paths end with the same JWT issued by the backend — identical user experience downstream.

---

### Backend Design

#### New Prisma model — `PhoneOtp`

```prisma
model PhoneOtp {
  id        String   @id @default(cuid())
  phone     String
  codeHash  String
  expiresAt DateTime
  used      Boolean  @default(false)
  attempts  Int      @default(0)
  createdAt DateTime @default(now())

  @@index([phone, used])
}
```

#### New endpoints

**`POST /auth/phone/send`**
- Accepts `{ phone: string }` (E.164 format, e.g. `+35988…`)
- Rate limit: max 3 OTP sends per phone per 10 minutes
- Generates 6-digit random code, bcrypt-hashes it, stores `PhoneOtp` record with 5-min expiry
- Sends SMS via Twilio: *"Your AgroTrade code is 123456"*
- Returns `{ success: true, expiresIn: 300 }`
- Errors: 429 if rate-limited, 400 if invalid phone format

**`POST /auth/phone/verify`**
- Accepts `{ phone: string, code: string }`
- Finds the latest non-used, non-expired `PhoneOtp` for the phone
- Max 5 failed attempts before the OTP is invalidated (increment `attempts`, return 400)
- On success: marks OTP as `used`, find-or-create `User` by `phoneNumber`, issue JWT
- Returns `{ accessToken, refreshToken, user }` — same shape as Privy login
- Errors: 400 if code wrong/expired, 410 if OTP exhausted

#### New `SmsService`

```
backend/src/sms/
  sms.module.ts
  sms.service.ts      ← wraps Twilio REST client
```

New env vars required:
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
```

#### Auth flow diagram

```
Client                    Backend                    Twilio
  │                          │                          │
  │  POST /auth/phone/send   │                          │
  │ ────────────────────────▶│                          │
  │                          │── send SMS ─────────────▶│
  │                          │◀─ delivered ─────────────│
  │◀── { expiresIn: 300 } ───│                          │
  │                          │                          │
  │  POST /auth/phone/verify │                          │
  │ ────────────────────────▶│                          │
  │◀── { accessToken, user } │                          │
```

---

### Frontend Design

#### New files

```
front-end/src/pages/Auth/
  AuthMethodSheet.tsx        ← two-tile choice screen
  PhoneAuthFlow.tsx          ← phone input + OTP input (two steps)
  components/
    AuthTile.tsx             ← single glassmorphism tile (reusable)
    CountryCodePicker.tsx    ← picker defaulting to 🇧🇬 +359
    OtpInput.tsx             ← 6-box digit entry with auto-advance
```

#### State management

New Zustand slice or additions to `authStore`:
- `authMethod: 'privy' | 'phone' | null`
- `phoneAuthStep: 'phone' | 'otp'`
- `pendingPhone: string`
- `otpResendAvailableAt: number` (timestamp)

#### Design tokens used

Matches existing glassmorphism system:
- Background: `rgba(255,255,255,0.04)`, border: `rgba(255,255,255,0.08)`, radius: 20
- Primary text: `rgba(255,255,255,0.85)`, subtitle: `rgba(255,255,255,0.45)`
- GlassButton for all CTAs, GlassCard for both tiles

---

## Section 2 — Bulgarian Localisation (i18n)

### Library choices

| Library | Purpose |
|---------|---------|
| `i18next` | Core i18n engine |
| `react-i18next` | React/RN hooks (`useTranslation`) |
| `expo-localization` | Detect device locale at startup |

### File structure

```
front-end/src/i18n/
  index.ts            ← init i18next, detect locale, set language
  locales/
    en.json           ← English strings (source of truth)
    bg.json           ← Bulgarian strings
```

### Namespace structure (en.json skeleton)

```json
{
  "common": {
    "loading": "Loading…",
    "error": "Something went wrong",
    "retry": "Try again",
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm"
  },
  "auth": {
    "welcome": "Welcome to AgroTrade",
    "chooseMethod": "How would you like to sign in?",
    "phone": "Phone",
    "phoneSubtitle": "No crypto needed",
    "wallet": "Wallet",
    "walletSubtitle": "Privy wallet",
    "enterPhone": "Enter your phone number",
    "sendCode": "Send Code",
    "enterOtp": "Enter the 6-digit code",
    "resendIn": "Resend in {{seconds}}s",
    "resend": "Resend code",
    "verify": "Verify"
  },
  "dashboard": {
    "tabs": {
      "home": "Home",
      "marketplace": "Marketplace",
      "orders": "Orders",
      "profile": "Profile"
    }
  },
  "marketplace": {
    "emptyTitle": "No listings yet",
    "emptySubtitle": "Pull down to refresh",
    "search": "Search crops…"
  },
  "orders": {
    "emptyTitle": "No active orders",
    "emptySubtitle": "Visit the marketplace to place your first order"
  },
  "phases": {
    "INITIATION": "Initiated",
    "SCHEDULING": "Scheduling",
    "SCHEDULED": "Scheduled",
    "IN_TRANSIT": "In Transit",
    "DELIVERED": "Delivered",
    "INSPECTION_PENDING": "Inspection Pending",
    "INSPECTION_IN_PROGRESS": "Inspection In Progress",
    "INSPECTED": "Inspected",
    "PAYMENT_PENDING": "Payment Pending",
    "PAYMENT": "Payment",
    "COMPLETED": "Completed",
    "CANCELLED": "Cancelled",
    "TRANSPORT_MATCHING": "Finding Transport",
    "TRANSPORT_BIDDING": "Transport Bidding"
  },
  "errors": {
    "network": "No internet connection",
    "unauthorized": "Session expired — please sign in again",
    "generic": "Something went wrong"
  },
  "profile": {
    "language": "Language",
    "languageEn": "English",
    "languageBg": "Български"
  }
}
```

### Language detection + persistence

```ts
// src/i18n/index.ts
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANG_KEY = '@agrotrade:language';

export async function initI18n() {
  const saved = await AsyncStorage.getItem(LANG_KEY);
  const deviceLang = Localization.locale.startsWith('bg') ? 'bg' : 'en';
  const lang = saved ?? deviceLang;
  await i18next.init({ lng: lang, resources: { en, bg } });
}

export async function setLanguage(lang: 'en' | 'bg') {
  await AsyncStorage.setItem(LANG_KEY, lang);
  await i18next.changeLanguage(lang);
}
```

### Language switcher UI

Located in the Profile tab drawer/settings section:

```
Language    [EN] [BG]
```

Two pill buttons — active state highlighted. Tapping switches language instantly (i18next hot-swaps without reload).

### Key screens to translate (MVP scope)

| Screen | Keys covered |
|--------|-------------|
| Auth / Onboarding | All `auth.*` + `common.*` |
| Dashboard tabs | `dashboard.tabs.*` |
| Marketplace tab | `marketplace.*` + `errors.*` |
| Orders / Buyer tab | `orders.*` + `phases.*` + `errors.*` |
| PhaseBadge component | `phases.*` |
| EmptyState component | Accepts translated strings from parent |
| ErrorBoundary | `errors.*` |
| Profile settings | `profile.*` |

Screens **not** in MVP scope (can be added later): Seller trade detail, Transporter/Inspector dashboards, push notification copy.

---

## Dependencies to install

### Backend

```bash
cd backend
npm install twilio
npm install --save-dev @types/twilio  # if needed
```

### Frontend

```bash
cd front-end
npx expo install i18next react-i18next expo-localization
```

---

## Environment variables

### Backend (`.env` + Railway)

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
```

### Frontend (`.env`)

No new env vars needed — language is derived from device locale / AsyncStorage.

---

## Security considerations

- OTP codes are **never stored in plaintext** — bcrypt hash only
- OTP expires in **5 minutes**
- Max **5 failed attempts** before OTP is invalidated (prevents brute force)
- Rate limit: **3 sends per phone per 10 minutes** (prevents SMS bombing)
- Phone numbers stored in `User.phoneNumber` field (already exists in schema)
- No PII logged — only `phone_suffix_****` in logs

---

## Acceptance criteria

### Dual Auth
- [ ] `POST /auth/phone/send` sends OTP via Twilio, returns in <2s
- [ ] `POST /auth/phone/verify` issues valid JWT on correct code
- [ ] Rate limiting blocks >3 sends/10min per phone
- [ ] >5 wrong attempts invalidates OTP
- [ ] AuthMethodSheet shows both tiles, both flows complete successfully
- [ ] Phone flow: 60s resend timer, 6-box OTP input with auto-advance
- [ ] Country code picker defaults to +359 🇧🇬

### Bulgarian i18n
- [ ] Bulgarian device → app renders in Bulgarian on first launch
- [ ] English device → app renders in English on first launch
- [ ] Language toggle in Profile persists across app restarts
- [ ] All `auth.*`, `phases.*`, `errors.*`, `marketplace.*`, `orders.*` keys translated
- [ ] No untranslated keys visible in either language
- [ ] PhaseBadge uses i18n labels

---

## Implementation order (recommended)

1. **Backend first** — Prisma migration, SmsService, phone auth endpoints, tests
2. **Frontend auth** — AuthMethodSheet, PhoneAuthFlow, hook into existing auth store
3. **i18n setup** — install libs, create i18n/index.ts, locales/en.json
4. **i18n translations** — locales/bg.json, wire `useTranslation` into key screens
5. **Language switcher** — Profile settings UI
6. **QA** — test both auth flows, test language switching, test persistence
