# Spain AgriFoodTech Sandbox — 2nd Call Application

> **Applicant:** Project Grain Sovereign (AgroTrade EU SAS)  
> **Sandbox Call:** 2nd Spain's AgriFoodTech Sandbox Call for Projects  
> **Deadline:** 15 May 2026  
> **Status:** Draft — ready for founder review and submission  
> **Sandbox URL:** https://sandboxagrifoodtech.es/en/

---

## 1. Project Identification

| Field | Entry |
|-------|-------|
| **Project title** | "Verifiable Digital Credentials for Cross-Border Agrifood Trade: An EBSI-AI Regulatory Sandbox" |
| **Acronym** | GrainSovereign-Sandbox |
| **Project promoter / legal entity** | AgroTrade EU SAS (to be registered in Strasbourg, France) |
| **Contact person** | [Founder Name], CEO |
| **Email / phone** | [founder@grainsovereign.eu] / [+33 ...] |
| **Website** | https://grainsovereign.eu |
| **Sector / value chain stage** | Primary production → First collection → Trade & Logistics |
| **Technology readiness level (TRL)** | TRL 6 (technology demonstrated in relevant environment) |
| **Regulatory frontier** | EU Data Act (B2G data sharing); EU AI Act (High-Risk AI for essential services access); EBSI cross-border verifiable credentials |

---

## 2. Executive Summary (250 words)

Project Grain Sovereign operates at the intersection of three regulatory frontiers: the EU Data Act (mandatory business-to-government data sharing), the EU AI Act (high-risk classification of voice-AI tools for farmers), and the European Blockchain Services Infrastructure (EBSI) cross-border trust framework.

Our platform connects 4.5 million small-scale European farmers to buyers via a mobile-first escrow and inspection system. We now seek to test — in a controlled environment — whether EBSI-compliant Verifiable Credentials (VCs) issued by freelance agrifood inspectors can replace paper-based quality certificates in Franco-German grain trade, and whether our voice-AI assistant for non-literate farmers meets the EU AI Act’s safety, bias, and transparency requirements for high-risk systems.

The Sandbox trial will:
1. Issue 50+ grain-quality VCs on the EBSI testnet, covering moisture, protein, mycotoxins, and GMO status.
2. Verify these VCs in a simulated German buyer environment (customs, bank trade-finance, miller ERP).
3. Test our voice-AI trade assistant under human oversight protocols required by Annex III of the AI Act.
4. Generate a regulatory evidence package for the EU AI Office, DG AGRI, and BLE on how sandboxed agrifood AI can safely achieve "Trustworthy AI" certification.

This directly produces the "regulatory, normative, and procedural learnings" the Sandbox is designed for, with applicability across the entire EU Single Market.

---

## 3. Regulatory Uncertainty & Sandbox Rationale

### 3.1 Problem Statement

Current European agrifood trade relies on paper/PDF certificates that are:
- **Slow:** 24–72 hours for cross-border verification.
- **Fraud-prone:** Easy to forge or tamper with.
- **Non-interoperable:** A French NF V03-707 certificate is not machine-readable by a German SAP S/4HANA system.

Meanwhile, AI tools that help marginalized farmers access trade markets fall under **Annex III (High-Risk)** of the EU AI Act, exposing startups to compliance costs that favor incumbents. No agrifood-specific regulatory sandbox exists to test these AI systems in a real-world, supervised setting before full market deployment.

### 3.2 Regulatory Gaps Addressed

| Gap | Current Rule / Uncertainty | Sandbox Learning Objective |
|-----|---------------------------|---------------------------|
| **EBSI credential validity** | No precedent for private agrifood inspectors as EBSI Trusted Issuers. | Can a Spanish-accredited Sandbox project generate legally admissible evidence for German BLE to recognize French-issued agrifood VCs? |
| **AI Act Annex III** | High-risk systems require risk management, bias correction, human oversight. | What is the minimum viable oversight protocol for voice-AI in agrifood trade? |
| **Data Act B2G** | Unclear what "exceptional need" data formats DG AGRI expects. | Can a real-time encrypted API satisfy Art. 15 proportionality requirements? |
| **Cross-border mutual recognition** | No harmonized digital standard for grain quality between FR and DE. | Does W3C VC + EBSI TIR registry achieve automatic mutual recognition under Regulation (EU) 2017/625? |

---

## 4. Objectives & Expected Results

### 4.1 General Objective

Generate regulatory evidence that enables safe, scalable deployment of EBSI-verified agrifood inspection credentials and farmer-facing voice-AI under the EU AI Act.

### 4.2 Specific Objectives

| # | Objective | KPI |
|---|-----------|-----|
| SO1 | Deploy EBSI testnet DID + Trusted Issuer proxy for 5 freelance inspectors. | 5 active DIDs; <500 ms VC verification latency. |
| SO2 | Issue 50 grain-quality VCs covering wheat, barley, and maize. | 50 VCs issued; 100 % schema compliance with W3C VC Data Model 2.0 + EBSI v3 JSON-LD. |
| SO3 | Simulate German buyer verification (customs, bank, miller) in Sandbox. | 3 verifier personas tested; acceptance rate ≥90 %. |
| SO4 | Run voice-AI trade assistant under human oversight for 20 farmers. | 20 farmer sessions; 0 critical safety incidents; bias audit report delivered. |
| SO5 | Produce regulatory evidence package for EU AI Office + DG AGRI. | 1 published white paper; 1 stakeholder workshop with BLE / DINUM. |

### 4.3 Expected Results

1. **Technical evidence:** EBSI VC schema for grain quality validated across Franco-German normative standards.
2. **Regulatory evidence:** AI Act compliance pathway for agrifood voice-AI, including bias-mitigation methodology.
3. **Market evidence:** German buyer willingness-to-adopt metric for machine-verifiable quality data.
4. **Policy evidence:** Recommendation brief for DG AGRI on "exceptional need" API specifications under the Data Act.

---

## 5. Methodology & Work Plan

### Phase 1 — Setup (Month 1)
- Register EU SAS legal entity.
- Configure EBSI CLI Organization Wallet + HSM (AWS CloudHSM Frankfurt).
- Recruit 5 freelance inspectors (France: Centre-Val de Loire region).
- Build voice-AI prototype (Whisper fine-tuned on agrifood terminology + Bulgarian/French/Romanian).

### Phase 2 — VC Issuance Trial (Month 2)
- Inspectors collect 50 grain samples.
- VCs issued on EBSI testnet with embedded NF + DIN standard references.
- Revocation list tested (Status List 2021).

### Phase 3 — Cross-Border Verification Simulation (Month 3)
- German buyer personas: Commerzbank trade-finance desk, Baden-Württemberg miller, Mannheim customs broker.
- Verify VCs via EBSI TIR API without contacting AgroTrade servers.
- Measure time-to-verify vs. paper baseline.

### Phase 4 — AI Oversight Trial (Month 3–4)
- 20 Bulgarian/French farmers use voice-AI to list grain.
- Human oversight operator (AgroTrade admin) reviews every AI-generated trade parameter.
- Bias audit on gender, language, and farm-size dimensions.

### Phase 5 — Evidence Synthesis (Month 4)
- Compile white paper.
- Organize closed workshop with BLE, DINUM, CNTA, and EU AI Office observers.
- Submit findings to Spain AgriFoodTech Sandbox steering committee.

---

## 6. Consortium & Partners

| Partner | Role | Country | Type |
|---------|------|---------|------|
| **AgroTrade EU SAS** (Applicant) | Project lead; platform owner; AI developer. | France | SME |
| **CNTA / EATEX** | Sandbox host; scientific methodology; regulatory liaison. | Spain | Research & Innovation Hub |
| **Eurofins Agro Testing France** | ISO 17025 lab partner; backs inspector VC validity. | France | Private lab |
| **Fraunhofer Institute (CEADS)** | CEADS federation node integration; interoperability testing. | Germany | Research institute |
| **Commerzbank AG** (Letter of Intent) | Trade-finance verifier persona; banking acceptance testing. | Germany | Bank |

*Note: Letters of Intent from Eurofins, Fraunhofer, and Commerzbank are in negotiation. CNTA participation is intrinsic to the Sandbox call.*

---

## 7. Budget & Funding Request

The Sandbox call offers **100 % funding** for trial execution. We request support for:

| Cost category | Amount (€) | Justification |
|--------------|-----------|---------------|
| Personnel (1 AI engineer, 1 regulatory fellow, 0.5 backend dev) | 28,000 | 4 months of dedicated effort |
| EBSI infrastructure (testnet + CloudHSM) | 4,000 | AWS Frankfurt eu-central-1 |
| Inspector mobilization (5 inspectors × 10 days) | 5,000 | Travel, sampling kits, per diem |
| Lab analysis (50 samples × €80) | 4,000 | Eurofins partner rate |
| Workshop & dissemination | 3,000 | Venue, interpretation FR-DE-EN, white-paper design |
| Legal & IP | 2,000 | GDPR compliance review, IP protection |
| **TOTAL** | **46,000** | |

*We are open to co-funding if the Sandbox budget ceiling requires it. AgroTrade can contribute €10,000 in-kind (platform development, existing backend infrastructure).*

---

## 8. Risk Management

| Risk | Probability | Mitigation |
|------|-------------|------------|
| EBSI testnet instability | Medium | Maintain fallback to EBSI devnet; use local VC caching. |
| Inspector recruitment delay | Low | Pre-negotiated pool of 8 inspectors from existing AgroTrade network. |
| German bank LOI falls through | Medium | Replace Commerzbank with DZ Bank agrifood desk or a German cooperative (Raiffeisen). |
| AI Act sandbox rules change | Low | Monitor EU AI Office weekly; build to general "high-risk" standards, not country-specific. |
| Voice-AI bias findings are negative | Low | Frame as learning; publish mitigation methodology regardless of result. |

---

## 9. Alignment with Sandbox Priorities

Although the 2nd call examples emphasize new ingredients and preservation, the Sandbox's **core mission** is "generating regulatory, normative, or procedural learnings." Our project directly serves this mission by:

- **Closing the regulation-innovation gap** for agrifood digital infrastructure (Data Act + AI Act).
- **Producing cross-border procedural evidence** that no single Member State can generate alone.
- **Supporting Spanish strategic leadership** in EU agrifood regulatory innovation — positioning Spain as the host of the bloc's first comprehensive agrifood sandbox.

---

## 10. Attachments Checklist

- [ ] Extract Kbis / Handelsregister (upon EU SAS registration)
- [ ] CV of project lead (founder)
- [ ] Letter of Intent from Eurofins Agro Testing France
- [ ] Letter of Intent from Fraunhofer Institute
- [ ] Letter of Intent from Commerzbank AG (agrfood trade finance)
- [ ] Technical annex: VC schema JSON-LD (`EBSI_TRUSTED_ISSUER_FR_DE_ROADMAP.md` §5)
- [ ] AI risk management plan (template: EU AI Office Annex IV)

---

## 11. Submission Instructions

1. Convert this document to PDF.
2. Submit via the Sandbox AgriFoodTech portal (link to be confirmed on `sandboxagrifoodtech.es`).
3. Send confirmation email to: `sandbox@cnta.es` and `eatex@cnta.es`
4. CC: `digitalisierung@ble.de` (for German regulatory awareness)

---

*Drafted: 2026-05-04*  
*Submission target: 2026-05-13 (48-hour buffer before deadline)*
