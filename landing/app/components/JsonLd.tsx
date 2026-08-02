import { pilotContactEmail } from '../lib/pilotContact';

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AgroTrade',
  url: 'https://agrotrade.africa',
  logo: 'https://agrotrade.africa/logo.png',
  description:
    'Builder of AgriTek, an evidence-backed operating workflow for cross-border agricultural trade.',
  ...(pilotContactEmail
    ? {
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'pilot enquiries',
          email: pilotContactEmail,
        },
      }
    : {}),
};

const pilotService = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'AgriTek Raspberry Exception Desk — Private Pilot',
  serviceType: 'Evidence and execution coordination for pre-sold replacement raspberry loads',
  provider: {
    '@type': 'Organization',
    name: 'AgroTrade',
    url: 'https://agrotrade.africa',
  },
  areaServed: [
    { '@type': 'Country', name: 'Spain' },
    { '@type': 'Country', name: 'Portugal' },
    { '@type': 'Country', name: 'Morocco' },
  ],
  audience: {
    '@type': 'BusinessAudience',
    audienceType:
      'Spanish produce buyers and importer-repackers, and qualified raspberry exporters or packhouses',
  },
  description:
    'A controlled private pilot that coordinates buyer requirements, exporter evidence, document gates, inspections and exception records. The exporter sells directly to the Spanish buyer, the buyer remains importer of record and pays the exporter directly. AgriTek does not hold funds, title or inventory, extend credit, guarantee a party or clear customs.',
  termsOfService: 'https://agrotrade.africa/terms',
};

const softwareApplication = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AgriTek Trade Operating System — Prototype',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS and Android',
  url: 'https://agrotrade.africa',
  description:
    'A prototype operating record for buyer requirements, supply readiness, negotiations, evidence, inspections, logistics milestones, acceptance and claims in agricultural trade.',
  isAccessibleForFree: true,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplication) }}
      />
    </>
  );
}
