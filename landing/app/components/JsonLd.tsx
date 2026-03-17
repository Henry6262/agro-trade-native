/**
 * JSON-LD structured data for Google Search rich results.
 *
 * Three schemas:
 *  - Organization   → Brand identity in Google Knowledge Graph
 *  - WebApplication → Product type + features for Google's "app" understanding
 *  - FAQPage        → "People also ask" rich result eligibility
 *
 * Uses dangerouslySetInnerHTML — safe here because the payload is 100% static
 * (no user input). This is the canonical Next.js pattern for structured data.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/metadata#json-ld
 */

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AgroTrade",
  url: "https://agrotrade.africa",
  logo: "https://agrotrade.africa/logo.png",
  description:
    "Blockchain-secured B2B agricultural trading platform connecting buyers, sellers, inspectors, and transporters across the Balkans, Middle East, and Asia.",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@agrotrade.africa",
  },
  areaServed: [
    "Balkans",
    "Middle East",
    "South Asia",
    "Southeast Asia",
    "North Africa",
  ],
};

const webApplication = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AgroTrade",
  url: "https://agrotrade.africa",
  applicationCategory: "BusinessApplication",
  operatingSystem: "iOS, Android",
  description:
    "End-to-end agricultural commodity trading with on-chain escrow protection via cUSD (Celo stablecoin). Built for B2B grain, produce, and livestock trades.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description:
      "Free to join. Platform takes a small escrow service fee per completed trade.",
  },
  featureList: [
    "Blockchain-backed escrow (Celo network)",
    "Multi-role workflow: Buyer, Seller, Inspector, Transporter",
    "Real-time trade status updates",
    "Dispute resolution mechanism",
    "cUSD stablecoin payments",
    "Mobile app (iOS & Android)",
  ],
};

const faqPage = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is AgroTrade?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AgroTrade is a B2B agricultural trading platform that protects payments using blockchain escrow on the Celo network. Buyers, sellers, inspectors, and transporters coordinate on a single platform — no blind trust required.",
      },
    },
    {
      "@type": "Question",
      name: "How does the escrow work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "When a trade is agreed, the buyer locks cUSD (a USD-pegged stablecoin) into a smart contract on Celo. Funds are only released to the seller after an independent inspector confirms delivery. If there's a dispute, a neutral admin reviews and resolves it on-chain.",
      },
    },
    {
      "@type": "Question",
      name: "Which countries does AgroTrade serve?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AgroTrade is launching in the Balkans (Serbia, Croatia, Bosnia, North Macedonia, Bulgaria) and expanding to the Middle East (UAE, Turkey, Saudi Arabia) and Asia. Any agricultural exporter or importer in these regions can join.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need cryptocurrency knowledge to use AgroTrade?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. AgroTrade uses a custodial model — the platform handles all on-chain transactions on your behalf. You trade in familiar USD-equivalent amounts (cUSD) without needing a crypto wallet or blockchain knowledge.",
      },
    },
    {
      "@type": "Question",
      name: "What commodities can be traded on AgroTrade?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AgroTrade supports all agricultural commodities: grain (wheat, corn, barley, sunflower), vegetables, fruit, livestock, and processed produce. Any bulk agricultural product can be listed and traded.",
      },
    },
  ],
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplication) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}
