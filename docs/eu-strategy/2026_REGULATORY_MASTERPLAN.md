# 2026 Regulatory Masterplan — Project Grain Sovereign

> **From:** AgroTrade (Celo escrow)  
> **To:** Grain Sovereign (EU Digital Public Infrastructure for agrifood)  
> **Horizon:** May 2026 – March 2028  
> **Status:** Strategic draft — pending founder approval to reallocate sprint capacity.

---

## 1. Strategic Thesis

By 2026, the European agrifood sector is no longer just a market. It is a **regulated data commons**. Four converging frameworks — the Data Act, CEADS, EBSI, and the AI Act — create a once-in-a-decade window for a first-mover platform that embeds compliance as infrastructure.

AgroTrade already has the operational core:
- Mobile-first escrow (farmers, truckers, buyers)
- Inspector network & quality verification
- Stablecoin settlement (cUSD)
- Admin dashboard with trade lifecycle management

**Project Grain Sovereign extends this core upward** into the EU institutional stack, transforming AgroTrade from a commercial escrow app into a **Trusted Data Partner** of the European Commission.

---

## 2. The Four Pillars & Project Translation

### Pillar 1 — EU Data Act (B2G Data Sharing)

| Regulatory Mechanism | What It Means for Grain Sovereign | AgroTrade Leverage |
|----------------------|-----------------------------------|-------------------|
| **Art. 14–22:** Mandatory B2G sharing under "exceptional need" | If the EU needs real-time grain stock data for a food crisis, we must provide it. | Our backend already captures real-time trade data (PostgreSQL + Socket.io). |
| **Art. 15(1)(b):** Public body must exhaust market purchase first | We can sell data via API *before* being compelled. | Build a "Commission API" tier on existing NestJS backend. |
| **Art. 20:** Fair compensation for data holders | Revenue stream: €0.05–€0.15 per data point for policy-use datasets. | Existing `TradeEvent` schema is the raw material; add aggregation/anonymization layer. |
| **Art. 15(2):** SME exemption from mandatory sharing | Small farmers (<50 employees) are exempt. We aggregate their data *with consent* and monetize as a cooperative intermediary. | Mobile app already has farmer consent flows for data sharing. |

**Sprint Translation:**
- **Backend:** New module `B2GApiModule` — read-only, encrypted, rate-limited endpoints for public-sector bodies.
- **Mobile:** Add granular consent toggles in farmer settings: "Share anonymized yield data with EU Commission? Y/N"
- **Contracts:** Data processing addendum to terms of service.

---

### Pillar 2 — CEADS (Common European Agricultural Data Space)

| CEADS Cycle 3 Requirement | Grain Sovereign Response | AgroTrade Leverage |
|---------------------------|--------------------------|-------------------|
| **Federation:** 36+ partners, 15 countries | Join as a "data intermediary" node. | Existing user base in Bulgaria; expand to FR, DE, RO. |
| **Consent:** Granular, dynamic, machine-readable | Implement CEADS consent widgets. | React Native frontend can render CEADS-compliant consent UIs. |
| **Governance:** NAO (Network Administrative Organisation) participation | Vote on data-space business models. | Founder representation in NAO working groups. |
| **Analytics:** AI-powered innovation | Feed trade data into CEADS analytics sandbox. | Historical trade + inspection data is a high-value training dataset. |

**Sprint Translation:**
- **Backend:** Implement CEADS connector SDK (Fraunhofer reference implementation) as a NestJS plugin.
- **DevOps:** Deploy a read-replica PostgreSQL node designated for CEADS federation queries.
- **Legal:** Sign CEADS data-sharing agreement (expected template release: June 2026).

---

### Pillar 3 — EBSI (European Blockchain Services Infrastructure)

| EBSI Component | Grain Sovereign Response | AgroTrade Leverage |
|----------------|--------------------------|-------------------|
| **Trusted Issuer:** Legally valid cross-border credentials | Accredit inspector network to issue grain quality VCs. | Inspector role already exists; add EBSI wallet + VC issuance. |
| **DID Registry:** Self-sovereign identity for actors | Farmer, buyer, transporter each get a DID. | Privy wallets can be mapped to EBSI DIDs. |
| **TIR (Trusted Issuers Registry):** Public verifiability | Inspector credentials verifiable across EU without phone calls. | Zero existing infra — greenfield build. |

**Sprint Translation:**
- See detailed roadmap: `EBSI_TRUSTED_ISSUER_FR_DE_ROADMAP.md`
- **Mobile:** Add EBSI-compatible wallet to inspector app (issue VCs offline, sync later).
- **Backend:** New `EbsiModule` — DID resolution, VC issuance, TIR proxy.

---

### Pillar 4 — EU AI Act (Trustworthy AI)

| AI Act Requirement | Grain Sovereign Response | AgroTrade Leverage |
|--------------------|--------------------------|-------------------|
| **Annex III High-Risk:** AI for "access to essential services" | Our voice-AI for non-literate farmers likely qualifies. | No existing voice-AI — this is a new R&D track. |
| **Risk Management:** Continuous risk identification | Establish AI risk register; CE-marking path. | New compliance function (1 FTE). |
| **Data Quality:** Representative, unbiased datasets | Harvest multilingual voice data (BG, RO, FR) with consent. | Mobile app distribution in Bulgaria = existing user base for data collection. |
| **Transparency & Human Oversight:** Explainable outputs | Every voice-AI recommendation shows a "Why" button linking to trade logic. | Reuse existing trade-state machine for explainability. |
| **2026 Omnibus SME simplifications:** Sandbox priority, reduced literacy burden | Enter Spain AgriFoodTech Sandbox by August 2026. | Startup status = automatic SME benefits. |

**Sprint Translation:**
- **AI/ML:** Prototype voice-to-trade-intent pipeline using open-source Whisper fine-tuned on agrifood terminology.
- **Legal:** Submit sandbox application to Spain AgriFoodTech (2nd call, Mar–May 2026).
- **UX:** Design "voice-first" trade creation flow for farmers with low literacy.

---

## 3. Integrated Trust Loop Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROJECT GRAIN SOVEREIGN                              │
│                    (The Four-Pillar Trust Loop)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐         │
│   │   CEADS      │◄──────►│   AgroTrade  │◄──────►│    EBSI      │         │
│   │  (Data Space)│  sync  │   Platform   │  attest│   (Trust)    │         │
│   └──────┬───────┘        └──────┬───────┘        └──────┬───────┘         │
│          │                       │                       │                 │
│          ▼                       ▼                       ▼                 │
│   ┌──────────────────────────────────────────────────────────────┐        │
│   │                     B2G DATA API                              │        │
│   │  (Data Act Art. 14 — Exceptional Need / Voluntary Sale)       │        │
│   └──────────────────────────────────────────────────────────────┘        │
│          ▲                                                                  │
│          │                       ┌──────────────┐                          │
│          └───────────────────────┤  AI Act      │                          │
│                                  │  Sandbox     │                          │
│                                  │  (Voice-AI)  │                          │
│                                  └──────────────┘                          │
│                                                                              │
│   ═══════════════════════════════════════════════════════════════════      │
│                         ACTORS (DID-Enabled)                                │
│                                                                              │
│    🧑‍🌾 Farmer          🏭 Buyer           🚛 Transporter      🔍 Inspector   │
│    └─ CEADS consent    └─ B2G API consumer  └─ Logistics VC  └─ EBSI VC   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**How the loop works:**
1. **Farmer** lists grain via voice-AI (AI Act sandbox).
2. **Inspector** verifies quality and issues an **EBSI VC**.
3. **Trade data** syncs to **CEADS** for market transparency.
4. **B2G API** makes aggregated, anonymized data available to DG AGRI for policy monitoring (Data Act).
5. **Buyer** verifies the VC on **EBSI** before releasing escrow.

---

## 4. 2026 Funding & Sandbox Calendar

| Window | Opportunity | Action | Owner | Status |
|--------|-------------|--------|-------|--------|
| **May 2026** | Horizon Europe CL6-2026-COMMUNITIES | Draft "Rural innovation" proposal; Grain Sovereign as DPI pilot. | Founder | 🔴 Urgent |
| **May 2026** | ETHPrague (GreenBlock) | Launch Gnosis Chain escrow as ReFi proof-of-concept. | Hackathon team | 🟢 Prepped |
| **Jun–Aug 2026** | Spain AgriFoodTech Sandbox (2nd Call) | Submit voice-AI + EBSI inspection project for regulatory testing. | Regulatory lead | 🔴 Apply |
| **Jul 2026** | PRIMA 2026 | Join Mediterranean agrifood resilience consortium as data partner. | BD | 🟡 Research |
| **Aug 2026** | AI Act Sandbox Mandatory Deployment | Secure national sandbox slot (Spain or Bulgaria). | Regulatory lead | 🔴 Critical |
| **Sep 2026** | CEADS Scale-Phase Onboarding | Complete federation node integration. | Backend lead | 🟡 Await specs |
| **Oct 2026** | EIC Accelerator 2026 (Cut-off 3) | Apply for €2.5M blended finance (grant + equity). | Founder | 🟡 Prepare deck |
| **Q4 2026** | DG AGRI Public Procurement | Respond to first DPI tender for agrifood data infrastructure. | BD + Legal | 🟡 Monitor TED |

---

## 5. Resource & Team Implications

### Current Team (AgroTrade)
- 1 Founder / PM
- 1 Backend (NestJS)
- 1 Mobile (React Native)
- 1 Admin Dashboard (React)
- 1 Smart Contract / DevOps

### Grain Sovereign Additions Required

| Role | FTE | Start | Cost / Month | Source |
|------|-----|-------|--------------|--------|
| **Regulatory Affairs Lead** | 0.5 | June 2026 | €4,000 | Founder (reallocated) or first hire |
| **EBSI / Blockchain Engineer** | 0.5 | July 2026 | €5,500 | Existing contract dev upskilled |
| **AI / Voice Engineer** | 0.5 | Aug 2026 | €5,000 | Horizon Europe sub-contractor |
| **EU Grant Writer** | 0.25 | May 2026 | €3,000 | Freelance (per-success fee preferred) |

**Total burn increase:** ~€8,500/month for 6 months = **€51,000**  
**Target non-dilutive funding:** €150,000–€500,000 from Horizon Europe + PRIMA + national sandboxes.

---

## 6. Risk Matrix

| Risk | P | I | Mitigation |
|------|---|---|------------|
| **Regulatory fatigue:** Team distracted from core escrow MVP | H | H | Grain Sovereign work capped at 40% of sprint capacity until first paying user on AgroTrade. |
| **EBSI TAO rejection** | M | H | Dual-track FR/DE strategy; fallback to national sandbox credentials. |
| **CEADS specs slip** | M | M | Build to open standards (W3C VC, GAIA-X) rather than CEADS-only APIs. |
| **AI Act sandbox waitlist** | M | H | Apply to both Spain and Bulgaria sandboxes simultaneously. |
| **Competitor first-mover** (e.g., Bayer, Syngenta digital platforms) | L | H | Incumbents move slowly on EU regulation; our agility is the moat. |
| **Crypto stigma blocks EU institutional deals** | M | H | Separate "Grain Sovereign" EU entity from crypto-native AgroTrade branding. Present escrow as "stablecoin settlement pilot," not blockchain ideology. |

---

## 7. Decision Gate

Before committing sprint capacity to this masterplan, the founder must confirm:

1. [ ] **AgroTrade pilot status:** Do we have 1 confirmed trucker + buyer pilot by June 15? If no, Grain Sovereign waits.
2. [ ] **Legal entity budget:** €3,000–€5,000 available to register EU SAS in Strasbourg.
3. [ ] **Founder bandwidth:** Can you allocate 2 days/week to regulatory affairs (calls, grant writing, TAO meetings) for Q3 2026?
4. [ ] **Technical pivot tolerance:** Are we willing to add EBSI dependencies (Java/Node EBSI SDK) to the backend, knowing it is not on the DevPrint critical path?

**If all four are checked, proceed to Phase 1 (May–June 2026).**  
**If any are unchecked, park this document and revisit July 1, 2026.**

---

## 8. Document Index

| File | Purpose |
|------|---------|
| `2026_REGULATORY_MASTERPLAN.md` | This file — strategic overview and decision gate. |
| `EBSI_TRUSTED_ISSUER_FR_DE_ROADMAP.md` | Detailed 6-step EBSI onboarding for France–Germany grain corridor. |
| `COMPLIANCE_ARCHITECTURE.md` | Existing crypto/finance compliance (KYC, AML, Travel Rule). |
| `MASTER_ROADMAP.md` | Existing product MVP roadmap (escrow, mobile, admin). |

---

*Document owner: Project Grain Sovereign Regulatory Track*  
*Last updated: 2026-05-04*  
*Next review: 2026-05-18 or upon pilot confirmation, whichever is earlier.*
