import { pilotContactEmail } from "../lib/pilotContact";

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AgroTrade",
  url: "https://agrotrade.africa",
  logo: "https://agrotrade.africa/logo.png",
  description:
    "Operator of the AgriTek private raspberry exception-desk pilot for controlled replacement-load coordination.",
  ...(pilotContactEmail
    ? {
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "pilot enquiries",
          email: pilotContactEmail,
        },
      }
    : {}),
};

const pilotService = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AgriTek Raspberry Exception Desk — Private Pilot",
  serviceType: "Evidence and execution coordination for pre-sold replacement raspberry loads",
  provider: {
    "@type": "Organization",
    name: "AgroTrade",
    url: "https://agrotrade.africa",
  },
  areaServed: [
    { "@type": "Country", name: "Spain" },
    { "@type": "Country", name: "Portugal" },
    { "@type": "Country", name: "Morocco" },
  ],
  audience: {
    "@type": "BusinessAudience",
    audienceType: "Spanish produce buyers and importer-repackers, and qualified raspberry exporters or packhouses",
  },
  description:
    "A controlled private pilot that coordinates buyer requirements, exporter evidence, document gates, inspections and exception records. The exporter sells directly to the Spanish buyer, the buyer remains importer of record and pays the exporter directly. AgriTek does not hold funds, title or inventory, extend credit, guarantee a party or clear customs.",
  termsOfService: "https://agrotrade.africa/terms",
};

export function JsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pilotService) }}
      />
    </>
  );
}
