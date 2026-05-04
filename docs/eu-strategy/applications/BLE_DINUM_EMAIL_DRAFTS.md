# BLE + DINUM Intro Email Drafts

> **Purpose:** Secure initial contact for EBSI Trusted Issuer accreditation  
> **Target:** BLE (primary TAO) + DINUM (fallback TAO)  
> **Tone:** Institutional, concise, value-first  
> **Send from:** founder@grainsovereign.eu (after EU SAS registration) or current professional email

---

## Email 1 — BLE (Bundesanstalt für Landwirtschaft und Ernährung)

**To:** digitalisierung@ble.de  
**CC:** (optional) `presse@ble.de` (if public affairs angle desired)  
**Subject:** EBSI Trusted Issuer Accreditation for Cross-Border Grain Quality Credentials — Project Grain Sovereign

---

Sehr geehrte Damen und Herren,

I am writing on behalf of **Project Grain Sovereign**, a European digital infrastructure initiative designed to reduce friction in Franco-German agrifood trade through EBSI-compliant Verifiable Credentials (VCs).

**The problem we solve**
Today, a grain quality certificate issued by a French cooperative lab requires 24–48 hours of manual verification before a German miller or bank accepts it. PDF forgery risks, translation costs, and out-of-band reputation checks slow down intra-EU trade for no regulatory benefit.

**Our solution**
We have built a mobile-first escrow and inspection platform (AgroTrade) now used by farmers and truckers across Southeast Europe. We are extending this platform to issue **W3C-standard, cryptographically signed grain-quality credentials** on the European Blockchain Services Infrastructure (EBSI). A German buyer verifying our credential queries the EBSI Trusted Issuers Registry (TIR) directly — no phone calls, no PDFs, no intermediary.

**Why BLE specifically**
As the federal agency operating Germany’s agricultural market information systems (MIP, Getreidemarktbericht), BLE is the natural Trust Anchor for agrifood data in Germany. By accrediting our inspector network as an EBSI Trusted Issuer, BLE would:
- Reduce administrative verification costs for German buyers of French grain.
- Generate a regulatory precedent for digital quality certificates under Regulation (EU) 2017/625.
- Support the BMEL Digitalisierung strategy and the CEADS Scale-phase objectives.

**What we request**
A 30-minute introductory call with your Digitalisierung or Datenmanagement team to discuss:
1. BLE’s role (or delegated role) as a Trusted Accreditation Organisation (TAO) under EBSI v3.
2. The evidence required to support a "Trusted Issuer Credential" application for agrifood inspection.
3. Whether BLE would accept a mutual-recognition letter from DGAL or FranceAgriMer as supporting documentation.

**Our credentials**
- Existing agrifood escrow platform with 37 passing smart-contract audits (Foundry/Celo).
- Partnership discussions underway with Eurofins Agro Testing France for ISO 17025 backing.
- Active application to the Spain AgriFoodTech Sandbox (2nd call, deadline 15 May 2026) for regulatory testing of EBSI + AI Act compliance.

I have attached a one-page technical brief for your review. We would be delighted to present the full roadmap in a video call at your earliest convenience.

Mit freundlichen Grüßen,

[Founder Name]  
CEO, AgroTrade EU SAS (in formation)  
[Phone] | [Email]  
https://grainsovereign.eu

**Attachment:** `EBSI_Trusted_Issuer_FR_DE_Roadmap.md` (PDF export)

---

## Email 2 — DINUM (Direction Interministérielle du Numérique)

**To:** ebsi-support@dinum.gov.fr  
**Subject:** Demande d'accréditation EBSI Trusted Issuer — Projet Grain Sovereign (certificats qualité céréales FR-DE)

---

Madame, Monsieur,

Je me permets de vous contacter au nom du **Projet Grain Sovereign**, une initiative d'infrastructure numérique européenne visant à sécuriser et fluidifier le commerce transfrontalier de céréales entre la France et l'Allemagne via des **credentials vérifiables EBSI** (Verifiable Credentials).

**Contexte réglementaire**
Le Règlement (UE) 2023/2854 (Data Act), l'entrée dans la phase "Scale" du CEADS (2026), et le déploiement de l'EBSI comme infrastructure de confiance obligent les acteurs agricoles à produire des preuves numériquesinteropérables. Or, aujourd'hui, un certificat de qualité PDF émis par un laboratoire coopératif français nécessite 24 à 48 heures de vérification manuelle avant d'être accepté par un meunier ou une banque allemande.

**Notre proposition**
Nous développons une couche de "confiance institutionnelle" pour la filière céréalière :
- Un réseau d'inspecteurs agricoles indépendants émet des **VC EBSI** (humidité, protéines, mycotoxines, OGM) directement depuis le champ.
- Un acheteur allemand vérifie le credential en <500 ms via le **Trusted Issuers Registry (TIR)** EBSI, sans contacter notre serveur.
- Les données agrégées (anonymisées) alimentent une API B2G conforme à l'Article 14 du Data Act, utilisable par la DG AGRI en cas de "besoin exceptionnel".

**Demande concrète**
Nous solliciterions un échange de 30 minutes avec votre équipe EBSI / Identité numérique pour clarifier :
1. La procédure d'accréditation **Trusted Issuer** pour une entité privée (SAS) dans le domaine "agrifood-inspection".
2. Le rôle de la DINUM comme **TAO (Trusted Accreditation Organisation)** de fallback si l'accrédition allemande (BLE) venait à être retardée.
3. Les exigences de sécurité (HSM, SecNumCloud) pour le endpoint du proxy EBSI.

**Éléments de crédibilité**
- Plateforme AgroTrade opérationnelle (escrow stablecoin, 37 tests smart-contract validés, backend NestJS).
- Candidature au Spain AgriFoodTech Sandbox (2e appel, deadline 15 mai 2026) pour tester la conformité EBSI + AI Act.
- Partenariat en discussion avec Eurofins Agro Testing France pour l'accréditation ISO 17025 des inspecteurs.

Je vous remercie par avance pour votre retour et reste naturellement disponible pour un échange téléphonique ou visioconférence.

Cordialement,

[Founder Name]  
CEO, AgroTrade EU SAS (en cours de constitution)  
[Téléphone] | [Email]  
https://grainsovereign.eu

**Pièce jointe :** `EBSI_TRUSTED_ISSUER_FR_DE_ROADMAP.md` (export PDF)

---

## Email 3 — EBSI Support Office (European Commission)

**To:** ebsi@ec.europa.eu  
**Subject:** EBSI Trusted Issuer Onboarding — Private Entity (Agrifood Inspection Domain)

---

Dear EBSI Support Office,

We are preparing the EBSI Trusted Issuer accreditation for **AgroTrade EU SAS**, a private legal entity operating in the agrifood inspection and digital trade-finance sector.

**Our use case**
Freelance agrifood inspectors issue W3C Verifiable Credentials (moisture, protein, mycotoxin levels) for cross-border grain trade between France and Germany. Buyers verify these credentials via the EBSI Trusted Issuers Registry without contacting the issuer.

**Questions before DID registration**
1. Is the EBSI v3 JSON-LD profile still the current standard, or should we prepare for v4 migration?
2. For private entities without direct government ownership, which Trusted Accreditation Organisation (TAO) category applies: "National Authority Delegation" or "EBSI Support Office Direct"?
3. What is the current average processing time from onboarding VC request to TIR mainnet enrollment?

**Technical readiness**
- Organization Wallet: EBSI CLI configured (testnet).
- Cryptography: ES256K + ES256 dual-curve support.
- Infrastructure: AWS CloudHSM in eu-central-1 (Frankfurt).

We would appreciate a 15-minute onboarding clarification call or written guidance at your earliest convenience.

Best regards,

[Founder Name]  
CEO, AgroTrade EU SAS  
[Email] | [Phone]

---

## Sending Protocol

| Step | Action | Date |
|------|--------|------|
| 1 | Export `EBSI_TRUSTED_ISSUER_FR_DE_ROADMAP.md` to PDF (1-pager + full doc) | 5 May |
| 2 | Send Email 1 (BLE) + Email 2 (DINUM) simultaneously | 5 May |
| 3 | Send Email 3 (EBSI Support Office) | 5 May |
| 4 | Calendar reminder: follow-up if no reply in 5 business days | 12 May |
| 5 | LinkedIn parallel outreach to BLE Digitalisierung team lead (find via Sales Navigator) | 6 May |

---

*Drafted: 2026-05-04*  
*Send from a professional domain (not @gmail). If EU SAS is not yet registered, use founder's existing corporate email with a note that GrainSovereign.eu domain will be active shortly.*
