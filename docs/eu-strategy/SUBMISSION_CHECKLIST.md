# 11-Day Action Checklist — May 15 Deadline

> **Today:** 4 May 2026  
> **Deadline:** 15 May 2026, 13:00 CET  
> **Goal:** Submit Spain AgriFoodTech Sandbox application + send TAO emails

---

## Day 1 — Today (4 May)

- [x] **Strategy docs drafted** — You are here.
- [ ] **Generate test DID** (5 min)
  ```bash
  cd normie-apps/agro-trade-native
  npm install jose elliptic node-fetch@2
  node scripts/generate-ebsi-testnet-did.js
  ```
  Copy output into `backend/.env`
- [ ] **Copy B2G key into .env** (1 min)
  ```
  B2G_API_KEYS=agro_b2g_741ce5f465e9f75fee7f5c79471d00a9149be4da5ec0668e06bc424cd83a84a8
  ```

---

## Day 2 — 5 May

- [ ] **Send 3 emails** (copy from `docs/eu-strategy/emails/`)
  1. `ble.txt` → `digitalisierung@ble.de`
  2. `dinum.txt` → `ebsi-support@dinum.gov.fr`
  3. `ebsi-support.txt` → `ebsi@ec.europa.eu`
  **Attach:** `docs/eu-strategy/EBSI_TRUSTED_ISSUER_FR_DE_ROADMAP.md` (PDF export)
- [ ] **Register EU SAS** in Strasbourg (or task lawyer)
  - Budget: €3–5k
  - Needed for: Sandbox legal entity + EBSI onboarding

---

## Day 3 — 6 May

- [ ] **Request LOI from Eurofins Agro Testing France**
  - Email: `agrofrance@eurofins.com`
  - Template in `MAY_15_SURVIVAL_BRIEF.md` §2
- [ ] **Request LOI from Fraunhofer FIT**
  - Email: `ceads@fit.fraunhofer.de`
- [ ] **Request LOI from CNTA / EATEX**
  - Email: `eatex@cnta.es`

---

## Day 4 — 7 May

- [ ] **Final review** of `SPAIN_AGRIFOODTECH_SANDBOX_APPLICATION.md`
- [ ] **Export to PDF** + gather attachments (CV, LOIs, roadmap)
- [ ] **Submit via** https://sandboxagrifoodtech.es/en/
  - If portal is not open yet, email `sandbox@cnta.es` with PDF attached

---

## Day 5 — 8 May

- [ ] **ETHPrague** (GreenBlock hackathon)
  - This is your credibility event — mention it in follow-up emails

---

## Day 6–9 — 9–12 May

- [ ] **Follow up** on emails if no reply (48-hour rule)
- [ ] **PRIMA decision gate:** Do you have 4+ partner LOIs?
  - **YES** → Submit Stage 1 pre-proposal by 10 May
  - **NO** → Park until PRIMA 2027, reuse narrative for EIC Accelerator

---

## Day 10–11 — 13–15 May

- [ ] **Final Sandbox confirmation** — ensure submission receipt received
- [ ] **Deadline buffer** — 15 May, 13:00 CET is hard stop

---

## Files Ready

| File | Location | Use |
|------|----------|-----|
| Sandbox application | `applications/SPAIN_AGRIFOODTECH_SANDBOX_APPLICATION.md` | Submit |
| PRIMA pre-proposal | `applications/PRIMA_2026_STAGE1_PREPROPOSAL.md` | Conditional |
| BLE email | `emails/ble.txt` | Copy-paste send |
| DINUM email | `emails/dinum.txt` | Copy-paste send |
| EBSI Support email | `emails/ebsi-support.txt` | Copy-paste send |
| EBSI roadmap | `EBSI_TRUSTED_ISSUER_FR_DE_ROADMAP.md` | Attach to emails |
| Regulatory masterplan | `2026_REGULATORY_MASTERPLAN.md` | Reference |
| URL list | `URLS.md` | Bookmarks |
| DID generator | `scripts/generate-ebsi-testnet-did.js` | Run locally |

---

*Owner: Founder*  
*Last updated: 2026-05-04*
