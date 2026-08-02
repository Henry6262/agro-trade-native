import type { Metadata } from "next";
import { LegalDraftPage } from "../components/LegalDraftPage";

export const metadata: Metadata = {
  title: "Privacy Draft",
  description: "Operational privacy draft for the AgriTek private raspberry exception pilot.",
  robots: { index: false, follow: false },
};

export default function PrivacyDraftPage() {
  return (
    <LegalDraftPage
      title="Privacy draft"
      summary="This draft explains the information AgriTek may process while assessing or operating a controlled replacement-load pilot."
    >
      <section>
        <h2 className="mb-3 text-xl font-bold text-white">1. Pilot scope</h2>
        <p>AgriTek is a private, invite-only coordination pilot operated by AgroTrade. It is not a public marketplace, payment institution, customs broker, insurer, laboratory or certification body.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">2. Information we may receive</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>business contact, role, legal-entity, VAT, EORI and authorized-operator details;</li>
          <li>buyer shortage requests, product specifications, pack and label requirements, arrival windows and acceptance protocols;</li>
          <li>exporter, packhouse, farm, lot, pallet, analysis, certification, insurance and bank-verification evidence;</li>
          <li>commercial, transport, customs, phytosanitary, conformity and traceability documents supplied by pilot participants;</li>
          <li>inspection records, photographs, timestamps, seal and temperature evidence, claims and written resolutions; and</li>
          <li>GPS or connected-device records only when a participant has actually connected and authorized that source.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">3. Why we process it</h2>
        <p>We use pilot information to assess eligibility, coordinate named operators, check evidence completeness, maintain an exception timeline, support origin and arrival comparison, facilitate a documented claim process, protect the pilot from fraud and evaluate whether the service should continue.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">4. Sharing</h2>
        <p>Information may be shared only as needed with the buyer, exporter, their authorized operators, customs representative, carrier, inspector, laboratory, insurer or professional advisers involved in the candidate load. Pilot-enquiry fields are delivered to the configured review inbox through Resend. Each participant remains responsible for its own legal basis, notices, confidentiality duties and document accuracy.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">5. Payments and financial data</h2>
        <p>AgriTek does not receive or release customer funds. The buyer pays the exporter directly through their agreed banking rails. AgriTek may record independently verified payment instructions or evidence that a commercial milestone occurred, but it does not operate the payment account.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">6. Retention and security</h2>
        <p>Retention periods, access roles, deletion rules and processor terms will be fixed in the final pilot data agreement. During the draft phase, access should be limited to named operators and evidence should not be retained longer than necessary for pilot evaluation, contractual claims or applicable legal duties.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-white">7. Your requests</h2>
        <p>Subject to applicable law and the final controller allocation, a person may request access, correction, deletion, restriction or an explanation of how pilot information is used by contacting the address below. We may need to verify identity and preserve records required for a live claim or legal duty.</p>
      </section>
    </LegalDraftPage>
  );
}
