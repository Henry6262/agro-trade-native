# AgriTek raspberry exception pilot packet

Status: operational draft for buyer interviews and controlled pilots. Commercial,
customs, food-law and insurance counsel must approve the final contract set before
a Morocco → Spain shipment.

## 1. Transaction boundary

AgriTek coordinates evidence and execution for a pre-sold replacement load.

- The exporter sells directly to the Spanish buyer.
- The buyer is importer of record and controls its customs representative.
- Buyer and exporter agree Incoterm, risk transfer, product acceptance and
  payment terms in their own written sale contract.
- The buyer pays the exporter directly through banking rails.
- AgriTek never takes title, owns inventory, extends credit, guarantees a party,
  clears customs or receives/releases customer funds.
- AgriTek invoices a separate coordination fee after a successful load.

Pilot price hypothesis: 2% of shipment value, €1,000 minimum, plus agreed
laboratory, inspection and logger costs at cost. This is a test, not a published
tariff.

## 2. Buyer shortage request

Complete before any supplier is approached.

| Field | Required entry |
| --- | --- |
| Request ID | |
| Buyer legal entity / VAT | |
| EORI and food-business registration confirmed by buyer | Yes / No |
| Buyer operations contact | |
| Customs representative | |
| Delivery site and receiving hours | |
| Required arrival window | |
| Number of loads / net kg per load | |
| Commodity / cultivar | Fresh raspberry / |
| Permitted origin | Portugal / Morocco / either |
| Pack format and label language | |
| Class / buyer specification version | |
| Minimum remaining shelf-life expectation | |
| Loading and arrival temperature range | |
| Defect categories and tolerances | |
| Required certifications | |
| Residue-analysis specification and laboratory recency | |
| Target Incoterm and named place | |
| Maximum delivered price / currency | |
| Payment instrument and timing | |
| Arrival sampling method | |
| Acceptance / claim-notice window | |
| Substitute-product permission | None unless written |

The buyer attaches the exact specification, label artwork, pallet pattern and
receiving protocol. Verbal tolerances do not pass the gate.

## 3. Supplier and packhouse qualification

AgriTek records evidence; it does not certify the supplier.

- Legal entity, beneficial ownership and verified business bank account.
- Export-capable packhouse and identified farms/lots.
- Applicable ONSSA registrations and export process for Moroccan supply.
- Current buyer-required GLOBALG.A.P./GRASP/SMETA and IFS/BRCGS evidence, where
  commercially required.
- Lot traceability from farm/harvest through pallet.
- Recent multiresidue analysis from an appropriately accredited laboratory,
  checked against the buyer's specification and EU requirements.
- Product-liability and cargo-insurance position disclosed.
- Two recent customer references and history of rejected/disputed loads.
- Available harvest/pack volume, lead time and cold-store capacity confirmed.
- No Western Sahara origin in the first Moroccan pilot.

Qualification result: `APPROVED_FOR_REQUEST`, `CONDITIONAL` or `REJECTED`, with
reviewer, timestamp, evidence links, expiry dates and unresolved conditions.

## 4. Written deal and shipment document gate

The exact gate is confirmed per origin, route, Incoterm and shipment date.

### Commercial file

- Buyer–exporter sale contract and accepted product specification.
- AgriTek coordination/fee agreement.
- Commercial invoice and packing list.
- Confirmed payment instructions through an independently verified channel.
- Incoterm, named place, risk-transfer point and claim window written explicitly.

### Export, border and traceability file

- CMR / transport instruction.
- Export declaration.
- Valid proof of preferential origin where claimed.
- Phytosanitary certificate for Morocco → Spain.
- Applicable conformity documentation.
- Farm, harvest, lot, pack date, pallet and seal traceability.
- Required analyses and current commercial certifications.
- Reefer set point, logger ID and calibration/verification evidence.
- Customs representative's pre-arrival confirmation, including required TRACES
  / CHED-PP handling for the Moroccan route.

Gate status is `RED`, `AMBER` or `GREEN`. Pickup is authorized only after `GREEN`
is recorded by named buyer/exporter operators. AgriTek's green status is an
evidence-completeness milestone, not legal or customs clearance.

## 5. Origin inspection record

Use the buyer's accepted sampling plan. Record at minimum:

- inspection timestamp, place, inspector identity and independence/conflict;
- farm/lot, pallet IDs, packaging, labels, gross/net weight and seal;
- pulp/air temperature and cold-store/reefer set point;
- sampled units and sampling method;
- mould/decay, crushing, leakage, softness, dehydration, colour/maturity,
  foreign matter and packaging damage against the written tolerances;
- optional buyer-required measures such as soluble solids;
- timestamped overview, pallet, label, defect, thermometer and seal photographs;
- retained-sample handling where agreed;
- result: `RELEASE`, `CONDITIONAL_RELEASE` or `REJECT` with signed reasons.

No inspected result can be overwritten. A correction creates a new version with
author, reason and timestamp.

## 6. Transit milestones

The pilot timeline uses evidence-backed operational events:

1. `REQUEST_ACCEPTED`
2. `SUPPLIER_SELECTED`
3. `SPEC_SIGNED`
4. `DOC_GATE_GREEN`
5. `ORIGIN_RELEASED`
6. `PICKED_UP`
7. `PORT_OR_BORDER_EVENT`
8. `ARRIVED_AT_BUYER`
9. `ACCEPTED` or `CLAIM_OPEN`
10. `CLAIM_RESOLVED`
11. `EXPORTER_PAYMENT_EVIDENCED`
12. `AGRITEK_FEE_INVOICED`

Each event stores actor, actual timestamp, evidence source and any exception.
GPS or temperature data is described as live only when a connected device has
actually supplied it.

## 7. Mirrored arrival inspection

The receiver uses the same defect definitions and a compatible sampling method
as origin. Record arrival time, unloading start, seal, logger file, temperatures,
pallet condition, sampled units, defects, photographs and disposition.

Result:

- `ACCEPTED`
- `ACCEPTED_WITH_RESERVATION`
- `PARTIAL_REJECTION`
- `REJECTED`

Acceptance never triggers an AgriTek-held payment release. It records the agreed
commercial milestone for buyer and exporter.

## 8. Claim protocol

A claim is opened inside the contractual notice window and contains:

- shipment, lot and affected pallet IDs;
- time of discovery and product-preservation steps;
- origin inspection, arrival inspection and full logger evidence;
- defect description, sampled quantity and affected quantity;
- photographs/video and independent survey where required;
- requested remedy and calculation;
- whether product can be sorted, reworked, discounted, redirected or destroyed;
- responses and counter-evidence from both parties.

Target operating rhythm: acknowledge within 2 business hours, complete the
evidence file within 12 hours, and reach a written resolution within 48 hours.
AgriTek facilitates and records; it is not the legal adjudicator unless a later
contract, insurance and regulatory review explicitly creates that role.

## 9. Post-load scorecard

| Metric | Result |
| --- | --- |
| Shipment GMV | |
| AgriTek fee revenue | |
| Third-party costs | |
| AgriTek operator minutes | |
| Document gate green ≥24h before pickup | Yes / No |
| On-time pickup / arrival | |
| Temperature excursions | |
| Claim opened / resolved hours | |
| Contribution after direct operating cost | |
| Buyer would reorder | Yes / No |
| Exporter would repeat | Yes / No |
| AgriTek assumed title, inventory, credit, customs or custody exposure | Must be No |

## 10. Pilot go/no-go

The load does not proceed until buyer, exporter and AgriTek each name an
authorized operator and confirm the final specification, document gate,
inspection plan, claim window, payment route and role boundary in writing.
