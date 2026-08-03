import type { Metadata } from "next";
import { LegalDraftPage } from "../components/LegalDraftPage";

export const metadata: Metadata = {
  title: "Pilot Terms Draft",
  description: "Operational terms draft for the AgriTek private raspberry exception pilot.",
  robots: { index: false, follow: false },
};

export default function PilotTermsDraftPage() {
  return (
    <LegalDraftPage
      title="Pilot terms draft"
      summary="These draft boundaries describe the coordination model shown on this site. A signed buyer–exporter sale contract and separate AgriTek pilot agreement must govern any real load."
    >
      <section>
        <h2 className="mb-3 text-xl font-bold text-white">1. Private pilot only</h2>
        <p>Access is by invitation and does not constitute a public offer, supplier approval, guaranteed capacity or commitment to coordinate a shipment. The website and portal are prototypes unless a specific pilot agreement says otherwise.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">2. Direct transaction</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>the exporter sells directly to the Spanish buyer;</li>
          <li>the buyer is importer of record and controls its customs representative;</li>
          <li>buyer and exporter agree product, price, Incoterm, risk transfer, acceptance, claims and payment in their own written contract; and</li>
          <li>the buyer pays the exporter directly through their agreed banking rails.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">3. AgriTek&apos;s limited role</h2>
        <p>AgriTek coordinates evidence and execution milestones for a candidate pre-sold replacement load. It never takes title, owns inventory, extends credit, guarantees either party, acts as importer of record, clears customs, receives customer funds or releases payment. A separately agreed coordination fee may be invoiced after a successful load.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">4. Evidence, not certification</h2>
        <p>AgriTek records evidence supplied or produced by named participants; it does not certify a supplier, laboratory, inspector or shipment. A green document-gate status means the agreed evidence file is complete for pilot purposes. It is not legal, food-safety, phytosanitary or customs clearance.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">5. Inspection and connected data</h2>
        <p>Origin and arrival records must follow the buyer-approved specification and sampling plan. GPS, temperature or other telemetry may be described as live only when an authorized connected device actually supplies it. Prototype screens and sample data are not proof that a real shipment is in transit.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">6. Claims and decisions</h2>
        <p>The buyer and exporter retain responsibility for acceptance, rejection, payment, remedies and legal claims under their contract. AgriTek may facilitate and record a claim file but is not the legal adjudicator unless a later signed agreement, insurance position and regulatory review expressly create that role.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">7. Final agreement required</h2>
        <p>No real load should proceed until buyer, exporter and AgriTek name authorized operators and confirm the final specification, document gate, inspection plan, claim window, payment route, data responsibilities and transaction boundary in writing.</p>
      </section>
    </LegalDraftPage>
  );
}
