# AI Voice Mode — Research Investigation Brief

> **Project:** agro-trade-native  
> **Status:** Pre-pilot, React Native Expo mobile app  
> **Target Users:** Bulgarian plains farmers (low tech literacy, voice-first preferred)  
> **Research Goal:** Find the best AND cheapest stack for implementing an AI voice assistant with animated characters.  
> **Date:** 2026-05-21

---

## 1. Product Context

### What the app does
AgroTrade is an agricultural commodity escrow platform on Celo. It connects:
- **Sellers (Farmers)** — grow wheat, corn, sunflower, etc. List products, receive offers, manage trades.
- **Buyers** — commodity buyers looking to purchase bulk agricultural products.
- **Transporters** — truck owners/drivers who bid on transport jobs and manage fleet.
- **Inspectors** — verify quality/quantity at pickup/delivery.

### Current stack
- **Mobile:** React Native Expo SDK 53, React 19, TypeScript
- **State:** Zustand
- **Navigation:** React Navigation v7 (Native Stack)
- **Backend:** NestJS API (REST + Socket.io)
- **Auth:** Privy (OAuth + embedded wallets)
- **Design:** Custom design system with `GradientBackground`, `GlassButton`, glassmorphism theme, green brand (#4ADE80)
- **Existing components:** `CharacterTourOverlay` (post-onboarding tour), `AnimatedRoleCard` (role selection)

### What we are building (AI Mode)
A voice-first AI onboarding and assistant experience:

1. **Entry Point:** On the Welcome/Login screen, users can select "Talk to AI" mode.
2. **AI Onboarding:** Instead of tapping through forms, the user TALKS to an animated character (GIF of their role: farmer, buyer, or transporter). The AI asks questions, extracts info, and fills the profile + first offer/listing entirely by voice. The UI updates live so the user sees what is being filled.
3. **Dashboard Assistant:** A floating bottom-right button on the dashboard opens the AI assistant. User can ask it to perform actions:
   - "Show me my offers"
   - "Create a new wheat offer for 500kg at 2.50 leva per kg"
   - "Accept the transport bid for 300 leva"
   - "Navigate to my fleet"
   - "What's the market price for corn today?"
4. **Character:** Full-screen animated GIF of the user's role character. Covers ~70-80% of screen. Chat bubbles/transcript visible. User can still see UI updating behind.

---

## 2. Research Questions (Investigate ALL)

### A. Voice AI Provider (MOST CRITICAL)

We need **real-time conversational voice AI** (not just text-to-speech bolted onto chat). The farmer speaks naturally, the AI responds naturally with low latency.

**Evaluate these and any others you find:**

| Provider | What to investigate |
|----------|---------------------|
| **OpenAI Realtime API** | WebRTC-based voice. Cost per minute. Bulgarian language support. React Native compatibility (expo doesn't have native WebRTC easily). |
| **OpenAI GPT-4o Audio** | Newer audio model. REST-based vs streaming. Cost. Quality for non-English. |
| **ElevenLabs Conversational AI** | Specifically built for voice agents. Pricing tiers. React Native SDK? WebRTC support? Bulgarian voices? |
| **Gemini Live API** | Google's real-time voice. Pricing. Bulgarian support. Mobile integration complexity. |
| **Deepgram + LLM** | Deepgram for STT, cheap. Pair with cheap LLM (DeepSeek, Gemini Flash). Latency? Two-pass vs single-pass? |
| **Cartesia Sonic** | New voice model. Pricing. Quality. |
| **Self-hosted / open source** | Whisper (STT) + Piper/TTS + local LLM via Ollama/llama.cpp. Feasibility on mid-range Android? Latency? |

**For each, answer:**
- Pricing (per minute, per token, monthly)
- Bulgarian language support (STT accuracy, TTS voice quality)
- React Native / Expo integration difficulty (native modules? webview hack?)
- Latency (how fast does it respond?)
- Offline capability (even partial?)
- Can it handle function calling / tool use? (The AI needs to call app actions)

**Constraint:** Cost matters A LOT. These are Bulgarian farmers. We need the cheapest viable option, not the fanciest. If a hybrid approach (cheap STT + cheap LLM + cheap TTS) beats a premium all-in-one on cost with acceptable latency, that's the winner.

### B. Character Animation / Visuals

The user sees an animated character representing their role:
- Seller → Farmer character
- Buyer → Businessman/buyer character  
- Transporter → Truck driver character

**Evaluate these approaches:**

1. **Animated GIFs** (what the founder plans to provide)
   - Looping GIFs for idle, talking, listening, happy, thinking states
   - How to swap GIFs smoothly in React Native? (`react-native-fast-image`? `expo-image`?)
   - Performance on low-end Android devices
   - File size budget

2. **Lottie animations**
   - The app already uses `lottie-react-native`
   - Can we get character animations in Lottie format? Pros/cons vs GIF
   - Smaller file size, vector scalability

3. **Live2D / Vtuber-style**
   - Too complex/heavy? Worth it?

4. **Simple PNG sequences**
   - Sprite sheet approach

5. **AI-generated talking head (HeyGen, D-ID)**
   - Real-time? Cost? Overkill?

**Answer for each:**
- Performance on low-end devices
- Ease of state switching (idle → talking → listening)
- File size per character
- Integration complexity in React Native

### C. Function Calling / Tool Use Architecture

The AI needs to PERFORM actions in the app, not just talk.

**Questions:**
- Which voice providers support native function calling?
- Should we use a client-side tool registry (AI calls JS functions directly) or server-side (AI calls backend API)?
- How to handle confirmation? (e.g., AI says "I'll create this offer for 500kg wheat at 2.50 leva. Confirm?" → user says yes → executes)
- Error handling when the AI mishears quantities/prices (Bulgarian numbers, currency "leva")

### D. Speech Recognition Specifics for Bulgarian

- Bulgarian STT accuracy across providers
- Number/currency recognition ("петстотин килограма" = 500kg, "два лева и петдесет" = 2.50 leva)
- Accent tolerance (rural Bulgarian accents)
- Code-switching (Bulgarians often mix English words — "два лева за kilo")

### E. React Native Audio / Voice Recording

- `expo-av` vs `@react-native-voice/voice` vs custom native module
- Permission handling (microphone on Android/iOS)
- Background audio / keeping mic alive during conversation
- Push-to-talk vs always-listening vs wake-word

### F. Backend Requirements

- Do we need a dedicated AI orchestration backend, or can the mobile app talk directly to the voice API?
- If we use a cheap LLM + cheap STT + cheap TTS, do we need a backend proxy to coordinate?
- Rate limiting, user session management
- Logging conversations for quality improvement

---

## 3. Non-Functional Requirements

| Requirement | Priority |
|-------------|----------|
| **Cost** | CRITICAL — must be viable for free/mass-market tier |
| **Bulgarian language** | CRITICAL — primary user language |
| **Low latency** | HIGH — under 2s response time ideal |
| **Low-end Android performance** | HIGH — farmers use budget phones |
| **Offline resilience** | MEDIUM — at least graceful degradation |
| **Battery efficiency** | MEDIUM — voice streaming is heavy |
| **Security** | MEDIUM — don't leak wallet keys via voice |

---

## 4. Deliverables Expected from Research

1. **Comparison Matrix** — All voice providers side-by-side with pricing, Bulgarian support, RN feasibility, latency
2. **Recommended Stack** — Top 1 choice with runner-up, justified by cost + feasibility
3. **Cost Projection** — Estimated monthly cost at 100 users, 1,000 users, 10,000 users (assume ~5 min voice session per user per day)
4. **Integration Guide** — High-level architecture diagram and key integration steps for the recommended stack
5. **Risk Assessment** — What could go wrong (Bulgarian STT fails, latency too high, costs explode) and mitigations
6. **Character Animation Recommendation** — GIF vs Lottie vs other, with RN implementation notes

---

## 5. What NOT to Research

- Do NOT research blockchain integration (we already use Celo/Privy)
- Do NOT research general AI/LLM chatbots (we need VOICE specifically)
- Do NOT research computer vision or image recognition
- Do NOT suggest rebuilding the app in Flutter or another framework

---

## 6. Existing Code References

Relevant files in the repo (for context on where this will integrate):

```
front-end/src/features/auth/screens/WelcomeScreen.tsx           → AI Mode entry point
front-end/src/features/onboarding/screens/RoleSelectionScreen.tsx → Role selection (determines character)
front-end/src/features/dashboard/screens/DashboardMainScreen.tsx  → Dashboard (floating AI button goes here)
front-end/src/features/onboarding/components/CharacterTourOverlay.tsx → Existing character overlay pattern
front-end/package.json                                           → Current deps (expo-av, lottie-react-native already present)
```

---

## 7. How This Connects to Business Goals

This feature is specifically for Bulgarian farmers who:
- Are not tech-savvy
- Prefer speaking over typing
- May not read/write English well
- Use budget Android phones
- Need to list products (wheat, corn, sunflower) and negotiate prices verbally

The AI mode removes ALL friction. A farmer opens the app, taps "Talk to AI," and 3 minutes later their profile is set up and their first wheat offer is live. This is the difference between adoption and abandonment.

---

**End of brief. Hand this to your research agent.**
