# EBSI Trusted Issuer Roadmap: France–Germany Cross-Border Grain Trade

> **Project Grain Sovereign — Regulatory Infrastructure Track**  
> **Scope:** Accredit AgroTrade inspection nodes as EBSI Trusted Issuers for grain quality credentials valid across the Franco-German border.  
> **Target Date:** TIR enrollment by Q4 2026; live issuance by Q1 2027.  
> **Status:** Draft — awaiting TAO outreach.

---

## 1. Executive Summary

The Franco-German cereal corridor is the largest intra-EU grain flow by volume. Today, a quality certificate issued by a French cooperative lab in Chartres is accepted in Stuttgart only after manual verification, PDF scanning, and often a counter-signature by a German chamber of commerce or bank. This friction costs 24–72 hours per shipment and creates fraud exposure.

By onboarding AgroTrade’s freelance inspector network as an **EBSI Trusted Issuer**, a moisture/protein/mycotoxin credential signed in France becomes **machine-verifiable in Germany in <500 ms** — no phone calls, no PDFs, no correspondent banks.

This document refines the generic 6-step EBSI roadmap to the specific institutional, linguistic, and regulatory realities of the France–Germany grain corridor.

---

## 2. The Cross-Border Problem

### 2.1 Current State

| Step | France (Origin) | Germany (Destination) | Friction |
|------|----------------|----------------------|----------|
| Inspection | Accredited lab / cooperative technician issues paper/PDF cert. | Buyer receives scan via email. | PDF forgery risk; no real-time revocation check. |
| Translation | Cert in French. | German buyer may require sworn translation. | €80–200 + 2–4 days. |
| Customs / Phytosanitary | Intra-EU — no TRACES NT for cereals destined to human consumption. | — | Low friction, but seed/grain for planting triggers TRACES. |
| Trade Finance | Seller presents cert to bank for documentary collection. | German bank verifies issuer out-of-band. | 24–48 h delay; issuer reputation risk. |
| Price Adjustment | Quality deviation from contract triggers re-negotiation. | Dispute over which lab standard applies (NF V03-707 vs. DIN EN ISO 6540). | Legal uncertainty, arbitration. |

### 2.2 EBSI Value Proposition

- **Cryptographic binding:** The VC is signed by the inspector’s DID, anchored to AgroTrade’s Trusted Issuer DID, registered on the EBSI ledger.
- **Instant cross-border verification:** German buyer’s wallet queries the EBSI Trusted Issuers Registry (TIR) — not AgroTrade’s servers.
- **Machine-readable standards:** JSON-LD schema embeds both French and German normative references, enabling automated price-adjustment smart contracts.

---

## 3. Regulatory & Institutional Context

### 3.1 EU-Level

| Regulation | Relevance to FR-DE Grain VCs |
|-----------|------------------------------|
| **(EU) 2023/2854 — Data Act** | Inspection data is non-personal IoT/service data; B2G sharing under Art. 14–22 if public crisis. |
| **(EU) 2017/625 — Official Controls** | Defines requirements for official control labs. Our freelance inspectors are *private* — but the Regulation encourages digital certification. |
| **(EU) 2016/2031 — Plant Health** | If grain is for planting (not food), phytosanitary certificates via TRACES NT apply. EBSI VCs can wrap TRACES metadata as a complementary trust layer. |
| **CEADS MVP Cycle 3 (Scale)** | Our VC schema must align with CEADS building blocks for data discovery and consent. |

### 3.2 France — National Layer

| Entity | Role | EBSI Relevance |
|--------|------|----------------|
| **DGAL** (Direction Générale de l'Alimentation, Min. Agriculture) | Food safety & official controls lead. | Potential **Trusted Accreditation Organisation (TAO)** for agrifood inspection domains. |
| **DGCCRF** (Répression des Fraudes) | Market surveillance, fraud prevention. | Could accredit "consumer protection" inspection VCs. |
| **FranceAgriMer** | Interprofessional body for cereals, wine, etc. | Industry trust anchor — not a TAO but a strategic partner for pilot adoption. |
| **DINUM** (Direction Interministérielle du Numérique) | French digital administration coordinator. | Gatekeeper to France’s EBSI node and TAO delegation. |
| **AFNOR** | Standards body (NF V03-707 for grain moisture). | Schema authority for French-specific quality fields. |

### 3.3 Germany — National Layer

| Entity | Role | EBSI Relevance |
|--------|------|----------------|
| **BMEL** (Bundesministerium für Ernährung und Landwirtschaft) | Top-level agrifood ministry. | Ultimate policy owner; can mandate acceptance of EBSI VCs for federal procurement. |
| **BLE** (Bundesanstalt für Landwirtschaft und Ernährung) | Implements BMEL policy, runs market data systems. | **Strong TAO candidate** — already operates digital systems (MIP, Getreidemarktbericht). |
| **BVL** (Bundesamt für Verbraucherschutz und Lebensmittelsicherheit) | Risk assessment & official labs. | Accredits private labs under ISO 17025; could accredit VC-issuing inspectors. |
| **Landwirtschaftskammern** (e.g., Hesse, Bavaria) | Regional chambers for farmers. | Local trust anchors; can push adoption among Mittelstand buyers. |
| **DIN** | German standards institute. | Schema authority for DIN EN ISO references. |

### 3.4 The TAO Conundrum

EBSI requires a **Trusted Accreditation Organisation (TAO)** to issue the "Trusted Issuer Credential." For a cross-border credential to be valid in *both* France and Germany, the optimal path is:

> **Dual-track TAO strategy:**  
> 1. **Primary accreditation:** BLE (Germany) — because Germany is the *consuming* market; buyer-side acceptance is the harder problem.  
> 2. **Mutual recognition letter:** DGAL or FranceAgriMer issues a non-EBSI letter of recognition that the French inspector network meets French agrifood standards, which BLE accepts as supporting evidence.  
> 3. **Fallback:** If BLE onboarding latency is >6 months, pursue **DINUM** as the French TAO route first, then rely on EU cross-border mutual recognition of TAO credentials under the EBSI Trust Model v3.

---

## 4. The 6-Step Roadmap (FR–DE Specific)

### Step 0 — Pre-Flight (NEW)

Before touching EBSI CLI, lock the French and German legal wrapper.

| Action | Detail | Owner | Deadline |
|--------|--------|-------|----------|
| **Legal Entity** | Register AgroTrade EU SAS (French simplified stock co.) or GmbH. EBSI requires a registered legal entity with VAT ID. | Legal / Founder | June 2026 |
| **ISO 17025 Partnership** | Partner with an existing accredited lab (e.g., InVivo lab, Eurofins) so inspector credentials are backed by accredited methodology. | BD | June 2026 |
| **Domain Name** | Secure `grainsovereign.eu` and register for EU Trademark. | Ops | May 2026 |
| **GDPR Representative** | Appoint EU data rep if parent is non-EU. | Legal | June 2026 |

---

### Step 1 — Wallet Setup

| Item | Specification |
|------|---------------|
| **Tool** | EBSI CLI (`ebsi-cli`) or self-hosted Org Wallet SDK |
| **Capabilities required** | `Accredit`, `Authorise`, `Issue`, `Revoke` |
| **Key types** | ES256K (secp256k1) for on-ledger DID; ES256 (P-256) for backward compatibility with legacy German eIDAS nodes |
| **HSM** | AWS CloudHSM or Thales Luna 7 — keys must be FIPS 140-2 Level 3 for high-value trade finance credentials |
| **Backup** | Shamir’s Secret Sharing (3-of-5) across FR, DE, and CH jurisdictions |

**FR–DE nuance:** German banks (e.g., Commerzbank agrifood desk) require P-256 for their existing eIDAS trust infrastructure. Support both curves in the DID document.

---

### Step 2 — Onboarding VC Issuance

| Item | Detail |
|------|--------|
| **Issuer** | EBSI Support Office or an existing TAO (target: BLE) |
| **Credential type** | `VerifiableAccreditation` (EBSI v3) |
| **Evidence required** | Extract Kbis (France) / Handelsregister (Germany); ISO 17025 partnership agreement; liability insurance (>€2M); AML/KYC policy (reuse existing AgroTrade `COMPLIANCE_ARCHITECTURE.md`). |
| **Pre-meeting** | Schedule bilateral with BLE Digitalisierungsteam and DINUM EBSI node operator. |

**Pitch angle for BLE:** "We are reducing the administrative cost of verifying French grain imports by 90%. Your TAO credential makes German buyers instantly trust French quality data."

---

### Step 3 — DID Registration

```json
{
  "@context": ["https://www.w3.org/ns/did/v1", "https://ebsi.eu/ns/did/v1"],
  "id": "did:ebsi:zf39q7d8...",
  "verificationMethod": [
    {
      "id": "did:ebsi:zf39q7d8...#keys-1",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:ebsi:zf39q7d8...",
      "publicKeyJwk": {
        "kty": "EC",
        "crv": "secp256k1",
        "x": "...",
        "y": "..."
      }
    },
    {
      "id": "did:ebsi:zf39q7d8...#keys-2",
      "type": "JsonWebKey2020",
      "controller": "did:ebsi:zf39q7d8...",
      "publicKeyJwk": {
        "kty": "EC",
        "crv": "P-256",
        "x": "...",
        "y": "..."
      }
    }
  ],
  "service": [
    {
      "id": "did:ebsi:zf39q7d8...#tir-proxy",
      "type": "TrustedIssuerProxy",
      "serviceEndpoint": "https://proxy.grainsovereign.eu/ebsi/tir"
    }
  ]
}
```

**FR–DE nuance:** The `serviceEndpoint` must be hosted in the EU (Frankfurt AWS `eu-central-1` or OVH Strasbourg) and hold a **SecNumCloud** or **C5** certification for French/German public-sector acceptance.

---

### Step 4 — Trusted Issuer VC Issuance

| Field | Value |
|-------|-------|
| **Type** | `TrustedIssuerCredential` (EBSI v3 profile) |
| **Issued by** | BLE (or DGAL/DINUM fallback) |
| **Domain** | `https:// GrainSovereign.eu/domains/agrifood-inspection` |
| **Scope** | `grain-quality`, `mycotoxin-screening`, `moisture-certification`, `logistics-inspection` |
| **Geographic validity** | `EU` (specifically `FR`, `DE`, `BE`, `NL`, `PL` for first expansion) |
| **Accreditation standard** | ISO 17025:2017 via partner lab |

---

### Step 5 — TIR Enrollment

- Register DID in the **EBSI Trusted Issuers Registry (TIR)** smart contract.
- Publish the `TrustedIssuerCredential` hash to the ledger.
- Enable **real-time status queries** — any German verifier can call `GET /trusted-issuers/{did}` and receive active status without contacting AgroTrade.

**FR–DE nuance:** Coordinate with BLE to ensure the TIR entry includes bilingual metadata (`de`, `fr`, `en`) so German ERP systems (SAP S/4HANA agrifood modules) can parse the issuer description.

---

### Step 6 — Proxy Registration & API Hardening

| Component | Spec |
|-----------|------|
| **Proxy** | Node.js / NestJS middleware (reuse existing backend stack) |
| **Issuance API** | `POST /v1/credentials/issue` — W3C VC Data Model 2.0 |
| **Revocation** | EBSI Status List 2021 (lightweight bitstring) + blockchain anchoring for high-value disputes |
| **Rate limits** | 1,000 req/min per inspector; burst to 5,000 for harvest season |
| **SLA** | 99.95% uptime (German buyers expect industrial-grade reliability) |

---

## 5. Verifiable Credential Schema: Grain Quality Certificate

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v2",
    "https://ebsi.eu/ns/credentials/v1",
    "https://grainsovereign.eu/ns/grain-quality/v1"
  ],
  "type": ["VerifiableCredential", "GrainQualityCertificate"],
  "issuer": "did:ebsi:zf39q7d8...",
  "validFrom": "2026-09-15T08:30:00Z",
  "validUntil": "2026-12-15T23:59:59Z",
  "credentialSubject": {
    "id": "did:key:z6Mk...inspector...",
    "inspection": {
      "inspectionId": "FR-2026-0915-78432",
      "inspectionDate": "2026-09-15T06:00:00Z",
      "location": {
        "address": "Route de Chartres, 28300 Bailleau-l'Évêque, France",
        "geo": {
          "type": "Point",
          "coordinates": [48.4911, 1.3986]
        }
      },
      "inspector": {
        "name": "Jean Dupont",
        "licenseNumber": "FR-INSP-78432",
        "accreditedBody": "Eurofins Agro Testing France"
      },
      "commodity": {
        "type": "Soft Wheat (Triticum aestivum)",
        "variety": "Apache",
        "harvestYear": 2026,
        "quantity": {
          "value": 25000,
          "unit": "kg"
        }
      },
      "qualityParameters": [
        {
          "parameter": "Moisture",
          "value": 14.2,
          "unit": "%",
          "standard": {
            "nf": "NF V03-707",
            "din": "DIN EN ISO 6540",
            "eu": "CEE Regulation 826/68"
          },
          "grade": "Grade 2"
        },
        {
          "parameter": "Protein (dry basis)",
          "value": 11.8,
          "unit": "%",
          "standard": {
            "nf": "NF V03-720",
            "din": "DIN EN ISO 20483"
          },
          "grade": "Bread-making quality"
        },
        {
          "parameter": "Hagberg Falling Number",
          "value": 298,
          "unit": "s",
          "grade": "Suitable"
        },
        {
          "parameter": "Deoxynivalenol (DON)",
          "value": 0.82,
          "unit": "mg/kg",
          "standard": {
            "eu": "(EU) 2023/915",
            "threshold": 1.25
          },
          "compliance": "PASS"
        }
      ],
      "visualCondition": "Good — no visible mould, insect damage <0.5%",
      "samplingMethod": "Automatic probe sampler, 10-point composite",
      "laboratory": {
        "name": "Eurofins Agro Testing France — Chartres",
        "iso17025Accreditation": "COFRAC n° 1-0001"
      }
    },
    "tradeContext": {
      "seller": "did:ebsi:abc...cooperative...",
      "buyer": "did:ebsi:def...miller...",
      "contractReference": "GS-FR-DE-2026-004412",
      "incoterm": "DAP",
      "destination": "Mannheim, Germany"
    }
  }
}
```

### 5.1 Multilingual Labels

For German buyer ERP ingestion, the VC includes a `display` object with i18n strings:

```json
"display": {
  "fr": { "title": "Certificat de Qualité Céréalière", "parameterLabels": {...} },
  "de": { "title": "Getreide-Qualitätszertifikat", "parameterLabels": {...} },
  "en": { "title": "Grain Quality Certificate", "parameterLabels": {...} }
}
```

---

## 6. Risk Scenarios & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **BLE refuses TAO accreditation** (political, not technical) | Medium | Project stall | Fallback to DINUM (France) + mutual recognition via EU Commission DG CNECT mediation. |
| **German banks reject EBSI VC for trade finance** | Low | Adoption block | Partner with Commerzbank / DZ Bank agrifood desk for a pilot Letter of Credit using EBSI VC as collateral evidence. |
| **French inspectors lack ISO 17025** | High | Credential invalid | White-label under Eurofins or InVivo lab accreditation; inspector acts as "authorized sampler." |
| **EBSI v4 breaking changes** | Medium | Tech debt | Subscribe to EBSI Early Adopter Programme; assign one backend engineer to EBSI changelog monitoring. |
| **GDPR conflict** (personal data in VCs) | Low | Fine | Keep credential non-personal. Inspector names are professional identifiers, not sensitive personal data under GDPR Art. 9. |
| **Brexit-style divergence** (DE exits mutual recognition) | Very low | Existential | Hedge by also seeking Swiss Accreditation Body (SAS) recognition for Alpine corridor. |

---

## 7. Timeline & Milestones

```
May 2026
├─ Legal entity registration (EU SAS)
├─ Pre-call with DINUM EBSI node
└─ ISO 17025 partnership term sheet

June 2026
├─ EBSI CLI wallet setup + HSM procurement
├─ Pitch deck for BLE Digitalisierungsteam
└─ Draft VC schema v0.9 (this document)

July–Aug 2026
├─ BLE TAO application submitted
├─ Onboarding VC request (if BLE accepts)
├─ AI Act sandbox entry (Spain AgriFoodTech)
└─ DID registration on EBSI testnet

Sep–Oct 2026
├─ TIR enrollment on EBSI testnet
├─ Pilot with 1 French cooperative → 1 German miller
├─ SAP S/4HANA connector prototype (German buyer side)
└─ CEADS federation node registration

Nov–Dec 2026
├─ TIR enrollment on EBSI mainnet
├─ Production issuance of first 50 VCs
├─ Horizon Europe CL6-2026 grant submission
└─ Public launch at EU AgriDataSpace Summit

Q1 2027
├─ Scale to 5 cooperatives (FR) + 3 millers (DE)
├─ Integration with CEADS Scale-phase discovery API
└─ Revenue model: €2.50 / VC issued (buyer pays)
```

---

## 8. Immediate Next Actions (This Week)

1. **Email BLE Digitalisierungsteam** (`digitalisierung@ble.de`) requesting 30-min intro call. Subject: *"EBSI Trusted Issuer Accreditation for Franco-German Grain Quality Credentials — Project Grain Sovereign."*
2. **Email DINUM** (`ebsi-support@dinum.gov.fr`) to confirm French TAO fallback path.
3. **Legal:** Draft EU SAS statutes with a registered address in Strasbourg (symbolic Franco-German bridge + OVH cloud proximity).
4. **BD:** Contact Eurofins Agro Testing France to discuss white-label ISO 17025 backing for freelance inspectors.
5. **Tech:** Spin up `ebsi-cli` in Docker, generate testnet DID, and verify against EBSI conformance test suite.

---

## 9. Appendix: Stakeholder Contact Map

| Stakeholder | Contact Point | Purpose |
|-------------|---------------|---------|
| BLE Digitalisierung | digitalisierung@ble.de | TAO accreditation (primary) |
| DINUM EBSI Node | ebsi-support@dinum.gov.fr | French TAO fallback |
| FranceAgriMer | numerique@franceagrimer.fr | Industry pilot partner |
| DG AL | dgal-ebsi@agriculture.gouv.fr | Regulatory alignment (speculative email) |
| EBSI Support Office | ebsi@ec.europa.eu | Generic onboarding questions |
| CEADS Coordination | ceads@fraunhofer.de | Data-space federation specs |

---

*Document owner: Project Grain Sovereign Regulatory Track*  
*Last updated: 2026-05-04*  
*Next review: 2026-05-18 (post-BLE intro call)*
