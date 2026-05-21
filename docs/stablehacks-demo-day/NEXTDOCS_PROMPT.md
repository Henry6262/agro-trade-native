# NEXTDOCS PROMPT — AgroTrade Pitch Deck
**Copy and paste this entire document into NextDocs to generate the StableHacks Demo Day pitch deck.**

---

## 1. PROJECT IDENTITY

**Project Name:** AgroTrade
**Tagline:** Compliance-first, dual-chain stablecoin escrow for agricultural commodities.
**One-Sentence Pitch:** AgroTrade is a compliance-aware, custodial escrow platform that connects farmers and commodity buyers through controlled stablecoin settlement on Celo and Solana.
**Track:** RWA-Backed Stablecoin & Commodity Vaults (StableHacks 2026)
**Demo Day:** Zurich, 28 May 2026. Live 3-minute pitch to AMINA Bank, Solana Foundation, UBS, SIX BFI, Fireblocks, Keyrock, Steakhouse Financial, Softstack.

---

## 2. THE PROBLEM

Agricultural commodity trade is a $3.4 trillion annual market that still runs on fax machines, phone calls, and 90-day wire transfers. For institutional players, this creates two impossible bottlenecks:

**Settlement Friction:**
- Cross-border commodity payments take 30–90 days.
- FX losses eat 3–7% of transaction value.
- Wire transfers leave no audit trail for regulators.
- In Bulgaria, 40% of grain deals fail due to payment delays.
- Small farmers in Spain's Extremadura region lose 25% of revenue to predatory lenders while waiting for payment.

**Compliance Darkness:**
- KYC is a PDF scan emailed to a broker.
- KYT (Know Your Transaction) does not exist for commodity flows.
- Travel Rule data is missing entirely.
- AML thresholds are ignored or manually checked.
- FINMA and MiCA require infrastructure that the market cannot deliver.

**The Result:** Banks cannot touch agricultural trade. Farmers cannot get working capital. Buyers cannot verify supply chains. Middlemen extract value while adding zero transparency.

---

## 3. THE SOLUTION — AGROTRADE PLATFORM

AgroTrade digitizes the entire agricultural trade lifecycle with stablecoin-powered escrow that is compliant, transparent, and instant.

**Full-Stack Platform:**
- **9-phase trade lifecycle:** Initiation → Seller Matching → Negotiation → Inspection → Escrow Lock → Transport → Delivery → Settlement → Completion
- **4 user roles:** Farmers, Buyers, Transporters, Quality Inspectors
- **Admin orchestration:** Trade matching, inspector assignment, route optimization, profit calculation, dispute resolution

**Dual-Chain Stablecoin Escrow:**
- **Celo (Primary):** cUSD escrow via AgroEscrow.sol — 37+ Foundry tests passing, deployed on Celo Sepolia. Optimized for low fees and mobile-first emerging markets.
- **Solana (Secondary):** USDC escrow via Anchor program — PDA-based vaults, 8 instructions, state machine enforcement, CPI security. High throughput for institutional volumes.
- **Custodial model:** Admin wallet executes all on-chain calls. Traders (farmers, buyers, transporters) never need to own or manage crypto wallets. This is critical for non-crypto-native agricultural markets.

**Real-Time Infrastructure:**
- WebSocket events (Socket.IO) push on every trade phase change to all parties simultaneously.
- Expo push notifications for mobile (iOS/Android).
- GPS tracking for transport monitoring with proof-of-delivery.
- Quality inspection with on-site photo documentation and AI scoring (0–100).

---

## 4. COMPLIANCE STACK — THE MOAT

This is the core differentiator. AgroTrade was built inside compliance, not around it.

**KYC (Know Your Customer):**
- Privy-powered tiered identity verification: Basic, Enhanced, Institutional.
- Google OAuth + JWT for seamless auth.
- Admin can freeze accounts instantly.

**KYT (Know Your Transaction):**
- Every transaction is logged as a TradeEvent with: blockchain tx hash, actor role, timestamp, amount, and metadata.
- Full audit trail from escrow creation to settlement.

**AML (Anti-Money Laundering):**
- Jurisdiction-configurable trade amount thresholds.
- Suspicious activity auto-flagging via admin dashboard.
- All escrow movements require admin authorization.

**Travel Rule:**
- Full originator (buyer) and beneficiary (seller) capture per Swiss and EU Transfer of Funds Regulation.
- Compliant data available for VASP-to-VASP information sharing.

**FINMA Guidance:**
- Trade-conditional escrow structure = not a deposit.
- MiCA-aligned CASP custody model.

---

## 5. TECHNICAL READINESS — PRODUCTION STATE

This is not a concept. This is working code.

**Smart Contracts:**
- Celo: AgroEscrow.sol (Solidity 0.8.20, OpenZeppelin, Foundry) — 37+ tests passing, deployed on Celo Sepolia.
- Solana: agro_escrow (Anchor, Rust) — 8 instructions, PDA vaults, state machine, CPI security, two-step admin transfer.
- Both contracts implement identical escrow logic: AwaitingPayment → AwaitingDelivery → Complete / Disputed / Refunded.

**Backend:**
- NestJS + TypeScript + Prisma + PostgreSQL.
- 205 TypeScript files.
- Live deployment on Railway.
- Chain-agnostic escrow service — backend determines Celo or Solana based on trade configuration.

**Mobile App:**
- React Native + Expo 52 + NativeWind.
- 574 TypeScript files.
- iOS and Android.
- Real-time WebSocket integration, push notifications, GPS tracking.

**Admin Dashboard:**
- Next.js + shadcn/ui.
- 25 pages.
- Trade orchestration, inspector assignment, profit calculation, dispute resolution.

**Integration Status:** 100% complete across all components (backend, mobile, admin, contracts). End-to-end golden path tested.

---

## 6. THE STRATEGIC PARTNER — AGRO TRADING BULGARIA LTD.

This is the traction anchor. AgroTrade is not pitching a theoretical pilot. We have a committed, operational partner with existing infrastructure.

**Partner Profile:**
- **Name:** Агро Трейдинг България ООД (Agro Trading Bulgaria Ltd.)
- **Founded:** 2017
- **Status:** One of the largest and fastest-growing grain brokers in Bulgaria. Absolute market leader in grain trade with Greece.
- **Headquarters:** Haskovo, Bulgaria
- **Contact:** office@agrotrading.bg | +359 895965588
- **Website:** https://agrotrading.bg/
- **Facebook:** https://www.facebook.com/Agro-Trading-Bulgaria-LTD-102215862551637

**Existing Infrastructure (Already Operational):**
- **Mobile laboratories:** Traders equipped with mobile labs for on-site grain analysis at the moment of sampling. All lab equipment calibrated against SGS control samples.
- **Fleet:** Own trucks, tractor units, and tipping semi-trailers for grain transport.
- **Storage:** Two grain buying, storage, and mixing bases.
- **Coverage:** National coverage across Bulgaria and Greece. Deliveries to major consumers in Bulgaria and port for own export. Direct relationships with multinational companies.
- **Staff:** Experienced traders in key Bulgarian regions, managers, drivers.
- **Commodities:** Soft wheat, hard wheat, corn, barley, sunflower, oats, rapeseed, peas, soybean meal, wheat bran, alfalfa pellets, and other grains/oilseeds.

**Cross-Border EU Project — AGRoGEo:**
- **Project:** "AGRO TRADING BULGARIA Ltd. – GEORGIKA EFODIA IKE"
- **Acronym:** AGRoGEo
- **Code:** IN1GB-0042140
- **EU Funding:** Interreg V-A Greece-Bulgaria 2014-2020, co-financed by European Regional Development Fund (ERDF)
- **Contract:** BFP Contract No. B5.3d.18/03.12.2020
- **Period:** 03.12.2020 – 02.12.2022
- **Greek Partner:** GEORGIKA EFODIA IKE (Kilkis, Greece) — http://www.euroagro.gr/
- **Results:** New machinery, vehicles, NIR grain analyzers, software, staff hiring, cross-border marketing, increased competitiveness in the Bulgaria-Greece border region.

**The Pain Point We Are Solving (Critical):**
Agro Trading Bulgaria's biggest operational bottleneck is their **logistics and trade management system**: a super old, custom-built platform that requires **manual data entry for every single trade, truck, quality check, and payment**. Their traders manually enter information into fragmented, outdated tools. No automation. No real-time visibility. No compliance trail. No auditability. This is not a theoretical problem — this is daily pain for a company moving thousands of tons of grain across the EU.

**Why This Partner Validates AgroTrade:**
- They ALREADY perform on-site grain quality analysis with NIR equipment — this validates the SkyInspect inspection layer.
- They ALREADY operate cross-border Bulgaria-Greece — this validates the corridor.
- They ALREADY have trucks, storage, and logistics — this validates the transport layer.
- They ALREADY navigate EU funding and regulation — this validates compliance capability.
- They are in **active pain** from manual legacy systems — AgroTrade is the direct replacement.
- They are ready to deploy AgroTrade's escrow and compliance stack across their entire operation and crew.

---

## 7. THE ASK — WHAT WE NEED

We are not asking for belief. We are asking for fuel and regulated partnerships.

| What We Need | What It Unlocks |
|-------------|-----------------|
| **AMINA Bank Pilot** | Regulated custody + fiat on-ramp + institutional credibility |
| **SIX BFI Data Partnership** | FX rates and commodity price feeds directly into pricing engine |
| **Solana Foundation DevRel** | Technical guidance, ecosystem introductions, institutional corridor support |
| **€100,000** | Smart contract audit + 6-month pilot runway + EU operator certification for drone layer |
| **Agro Trading Bulgaria** | Immediate deployment partner with fleet, labs, storage, and cross-border Greece corridor |
| **1 Committed Buyer** | 12-month forward contract (Germany or Greece) |

**Geographic Strategy:**
- **Bulgaria-Greece (Primary):** Via Agro Trading Bulgaria. Existing grain corridor to Greece (Kilkis region) and Danube port → Germany/Austria. Partner: Agro Trading Bulgaria + GEORGIKA EFODIA IKE.
- **Spain (Secondary):** Extremadura / Andalusia. Olives, citrus, almonds. Spain AgriFoodTech Sandbox application submitted May 2026.

---

## 8. NEXT INITIATIVES — THE PRODUCT ROADMAP

### Initiative A: SkyInspect — Autonomous RWA Verification Layer
**What it is:** Drone-based crop inspection that turns physical commodities into verified on-chain data.

**How it works:**
1. GPS waypoint auto-navigation to crop marker.
2. RTK-GNSS precision landing (±2cm accuracy).
3. Robotic arm deploys sterile sampling probe.
4. 50g soil + plant tissue extracted.
5. On-device NIR spectroscopy + edge AI (Gemma 4 / TensorFlow Lite).
6. Quality score generated: moisture, protein, contamination %.
7. Data transmitted to backend in <500ms via 4G/5G or LoRa mesh.
8. EBSI-verifiable credential issued — cross-border recognized in EU.

**Why it matters:** Without verified quality data, escrow is just a locked box. SkyInspect is the key. It provides the RWA oracle that feeds real-world commodity quality directly into smart contract logic.

**Validation from Partner:** Agro Trading Bulgaria ALREADY operates mobile laboratories with NIR grain analyzers calibrated to SGS standards. They validate that on-site spectroscopic analysis is the industry standard. SkyInspect automates and scales what they already do manually.

**Hardware stack (per unit, ~€8,100):**
- DJI Matrice 30T (€3,200)
- D-RTK 2 Mobile Station (€1,800)
- Custom 3-DOF robotic arm + soil probe (€800)
- Ocean Insight Flame-S NIR Spectrometer (€1,200)
- Google Coral Dev Board Mini + TPU (€120)
- Quectel RM500Q-GL 5G module (€180)
- TB65 Batteries × 4 (€800)

**China Research Context:**
China already deploys 28,000 agricultural drones daily with advanced hardware (DJI Agras T50, FLOAT Drone from Zhejiang University, in-situ NIR analysis). However, China's ecosystem is a walled garden: CAAC-locked hardware, RMB-only settlement, no EU regulatory alignment. Their average farm size is 0.6 hectares — too small for precision inspection economics. EU average farm size is 16 hectares — the perfect target for high-value per-hectare inspection. Our moat is NOT the drone hardware. Our moat is the only stack combining proven hardware with EU institutional compliance (Data Act, CEADS, EBSI, MiCA).

### Initiative B: HarvestShares — Fractional Crop Futures
**What it is:** Buyers purchase fractional ownership of a crop BEFORE it grows. Farmers get working capital in winter. Buyers get guaranteed allocation.

**How it works:**
1. Winter: Farmer lists "Batch #2847" — 100 hectares winter wheat.
2. Buyer in Munich buys 30% @ €12,000. Buyer in Thessaloniki buys 20% @ €8,000.
3. Farmer receives cUSD instantly — settled in 3 seconds. No predatory loans.
4. Spring/Summer: SkyInspect drone verifies crop health. AI score: 87/100. EBSI credential issued.
5. Harvest: Grain delivered to Danube port or Greece border. Escrow releases. Buyers receive share.
6. If crop fails (drought, flood, disease): smart contract pro-rata refund. No court. No broker.

**Technical implementation:**
- ERC-1155 semi-fungible tokens (shares fungible within batch, non-fungible across batches).
- cUSD settlement on Celo.
- Pro-rata refund logic in smart contract.
- KYC-gated, Travel Rule compliant, MiCA-aligned.

**Market validation:** Pinduoduo proved fractional crop pre-sales work for 800 million Chinese consumers. HarvestShares adds blockchain escrow and cross-border stablecoin settlement for European institutional buyers.

### Initiative C: Project Grain Sovereign — EU Regulatory Track
**What it is:** A parallel regulatory strategy to position AgroTrade as a Digital Public Infrastructure (DPI) provider under EU agrifood regulation.

**Regulatory pillars:**
- **Data Act Article 14:** Real-time agrifood data sharing with DG AGRI.
- **CEADS:** Cross-border federated data nodes for grain quality.
- **EBSI Trusted Issuer:** Verifiable cross-border credentials for grain inspection.
- **MiCA:** CASP-aligned custody and e-money token compliance.
- **AI Act:** Sandbox certification for edge AI models before production deployment.

**Status:**
- EBSI Trusted Issuer France-Germany cross-border grain inspection credential roadmap drafted.
- Spain AgriFoodTech Sandbox application submitted May 2026.
- Discussions with Bulgarian Grain and Feed Association ongoing.

**Constraint:** Grain Sovereign work is capped at 40% of sprint capacity until AgroTrade has a confirmed paying pilot. No AI product features ship to production before sandbox certification.

---

## 9. COMPETITIVE LANDSCAPE

| Competitor | What They Do | Why We Win |
|-----------|-------------|-----------|
| **DJI / XAG** | Hardware + imagery (China domestic) | Blocked from EU by regulation and data sovereignty. No compliance layer. |
| **Pinduoduo** | Consumer marketplace + pre-sales (China) | No EU infrastructure. No blockchain escrow. No institutional compliance. |
| **AgriDigital** | Fiat SaaS for grain trading (Australia) | No blockchain escrow. No stablecoin settlement. No cross-border compliance. |
| **Centrifuge** | DeFi RWA lending (EU team) | No physical-world verification layer. No inspection data. No agrifood specialization. |
| **AgroTrade** | Full-stack escrow + compliance + verification | Only player at the intersection of autonomous agritech, blockchain settlement, and EU regulatory compliance. Plus: committed operational partner with existing infrastructure. |

**Our quadrant:** High tech complexity + High compliance. Nobody else occupies this space.

---

## 10. TEAM

**Henry (Henry6262) — Lead Developer & Architect**
- Full-stack builder: NestJS, React Native, Solidity, Anchor/Rust.
- Built entire platform: backend (205 files), mobile (574 files), contracts (Celo + Solana), admin dashboard.
- Deep expertise in compliance architecture: KYC/KYT/AML/Travel Rule/FINMA.
- Geographic focus: Bulgaria and Greece markets via committed partner.

**Strategic Partner — Agro Trading Bulgaria Ltd.**
- Operational grain broker since 2017.
- Market leader in Bulgaria-Greece grain trade.
- Mobile labs, fleet, storage, EU-funded cross-border infrastructure.
- Ready to deploy AgroTrade across entire crew and operation.

**Extended Team:**
- Contracted mobile developer (React Native/Expo)
- Compliance advisor (EU regulatory strategy, Grain Sovereign track)

---

## 11. JUDGING CRITERIA ALIGNMENT

StableHacks Demo Day judges evaluate on 5 dimensions. Here is how AgroTrade maps to each:

**1. Team Execution & Technical Readiness:**
- 37+ Foundry tests passing. Anchor program on Solana with PDA security. Live backend on Railway. Feature-complete mobile app. This is production code, not a concept.

**2. Institutional Fit & Compliance Awareness:**
- KYC/KYT/AML/Travel Rule built in from day one. FINMA trade-conditional escrow structure. MiCA-aligned custody. Designed for regulated banks, not crypto natives.

**3. Stablecoin Infrastructure Innovativeness:**
- Dual-chain escrow: Celo cUSD for emerging markets, Solana USDC for institutional throughput. Custodial model abstracts all blockchain complexity. Same backend, chain-agnostic service.

**4. Scalability & Adoption Potential:**
- Immediate deployment via Agro Trading Bulgaria — existing fleet, labs, storage, cross-border Greece corridor.
- Bulgaria → Greece → Balkans → EU cross-border → Global emerging markets.
- Multi-commodity: wheat, corn, sunflower, olives, citrus, and more.
- Institutional path via custodial model means banks integrate without exposing clients to crypto UX.

**5. Submission Clarity & Completeness:**
- Public GitHub. Live backend. Deployed contracts. Documented API. Real partner committed. Clear pilot plan. Specific partnership asks.

---

## 12. DECK REQUIREMENTS FOR NEXTDOCS

**Format:** High-fidelity PDF export, 16:9 slide ratio, institutional design.
**Tone:** Confident, precise, institutional. Not playful. Not agritech-pop. This is fintech infrastructure.
**Visual style:** Dark theme preferred (navy/black background, teal or green accent, clean sans-serif typography). Minimalist. Data-forward.
**Number of slides:** 8–10 slides max for a 3-minute pitch.

**Required slides:**
1. **Hook:** The $3.4T problem. One big number.
2. **Problem:** Settlement friction + compliance darkness. Include: even market leaders like Agro Trading Bulgaria still run on manual data entry and fragmented old software. Split screen.
3. **Solution:** Platform overview + dual-chain architecture. Timeline or flow diagram. Show how AgroTrade replaces manual legacy systems.
4. **Compliance Stack:** KYC/KYT/AML/Travel Rule grid. This is the moat.
5. **Technical Readiness:** Stats (37 tests, 205 files, 574 files, live deployment). Logos of technologies used.
6. **The Partner — System Replacement:** Agro Trading Bulgaria. Before: manual entry, old custom software, fragmented tools. After: AgroTrade automation, real-time tracking, compliance-ready audit trail. Show the transformation.
7. **RWA Oracle / SkyInspect:** Drone verification layer. How physical commodities become on-chain data. Connect to partner's existing NIR labs.
8. **Traction & Ask:** Partner logos (Agro Trading Bulgaria, GEORGIKA EFODIA). Map showing Bulgaria-Greece corridor. Partnership targets (AMINA, SIX, Solana Foundation). The €100K ask.
9. **Close:** "We are not guessing. We are replacing a system that already moves grain across the EU." Contact + QR code.

**Optional but powerful:**
- Competitive quadrant map (High Tech + High Compliance = only AgroTrade).
- Solana + Celo architecture diagram.
- HarvestShares lifecycle diagram (Winter → Spring → Summer → Harvest).
- AGRoGEo project badge or EU funding mention.

---

## 13. KEY PHRASES TO FEATURE ON SLIDES

- "$3.4 trillion in agricultural trade runs on fax machines and 90-day wires."
- "We did not bolt on compliance. We built the platform inside it."
- "Custodial model — farmers and buyers never touch a wallet. This is what makes the system usable for real-world operators."
- "37 Foundry tests passing. Anchor escrow on Solana. Working MVP with real settlement logic."
- "Our partner already operates mobile NIR labs and a cross-border grain fleet — and they are in daily pain from manual legacy systems. We are replacing that pain."
- "We are not guessing. We are replacing a system that already moves grain across the EU."
- "China proved the technology. The EU mandated the data infrastructure. We are the only team building at the intersection of both."
- "The future of commodity finance is not a wire transfer. It is programmable."

---

*Prompt compiled: 2026-05-16*
*Target: StableHacks Demo Day, Zurich, 28 May 2026*
