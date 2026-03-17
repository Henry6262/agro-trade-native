import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const BASE_URL = "https://agrotrade.africa";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Primary ────────────────────────────────────────────────────────────────
  title: {
    default: "AgroTrade — Secure Agricultural Trading",
    template: "%s | AgroTrade",
  },
  description:
    "Blockchain-secured escrow for B2B agricultural trades. Buyers, sellers, inspectors, and transporters on one platform — no blind trust, no payment risk. From the Balkans to the Middle East and Asia.",

  // ── Canonical ──────────────────────────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
  },

  // ── Discovery ──────────────────────────────────────────────────────────────
  keywords: [
    "agricultural marketplace",
    "agricultural escrow",
    "B2B agri trading",
    "Balkans agriculture",
    "Eastern Europe grain trade",
    "Middle East agri import",
    "blockchain escrow",
    "cUSD Celo",
    "farm produce trading",
    "supply chain security",
    "food security platform",
    "agri-fintech",
    "smart contract escrow",
    "commodity trading platform",
  ],
  category: "Business",
  authors: [{ name: "AgroTrade", url: BASE_URL }],
  creator: "AgroTrade",
  publisher: "AgroTrade",

  // ── Open Graph ─────────────────────────────────────────────────────────────
  openGraph: {
    title: "AgroTrade — No Blind Trust. Just Trade.",
    description:
      "The agricultural trading platform that protects every payment with blockchain escrow on Celo. Starting in the Balkans — built for the world.",
    url: BASE_URL,
    type: "website",
    siteName: "AgroTrade",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AgroTrade — Secure Agricultural Trading Platform",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X ────────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "AgroTrade — No Blind Trust. Just Trade.",
    description:
      "Blockchain-secured payments for agricultural trades. From the Balkans to the Middle East and Asia.",
    images: ["/og-image.png"],
    // site: "@agrotrade",  // uncomment once handle is live
  },

  // ── Icons ──────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/logo.png" },
    ],
  },

  // ── PWA / theme colour ─────────────────────────────────────────────────────
  // Note: manifest.ts handles the full PWA manifest at /manifest.json
  // This sets the browser chrome colour on mobile
  other: {
    "theme-color": "#E8C870",
    "color-scheme": "dark",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "AgroTrade",
    "application-name": "AgroTrade",
    "msapplication-TileColor": "#0C0904",
    "msapplication-TileImage": "/icon-192.png",
  },

  // ── Crawling ───────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Verification (add once accounts are claimed) ───────────────────────────
  // verification: {
  //   google: "GOOGLE_SEARCH_CONSOLE_TOKEN",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} antialiased`}
        style={{ backgroundColor: "#021207", color: "#ffffff" }}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
