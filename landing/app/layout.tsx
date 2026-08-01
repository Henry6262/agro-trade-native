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
    default: "AgriTek — Raspberry Exception Desk",
    template: "%s | AgriTek",
  },
  description:
    "Private pilot for evidence and execution coordination on pre-sold raspberry replacement loads into Spain from Portugal or Morocco.",

  // ── Canonical ──────────────────────────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
  },

  // ── Discovery ──────────────────────────────────────────────────────────────
  keywords: [
    "raspberry supply exception",
    "fresh produce exception desk",
    "raspberry replacement load",
    "Morocco Spain raspberry import",
    "Portugal Spain raspberry supply",
    "produce document gate",
    "cold chain evidence",
    "arrival inspection coordination",
  ],
  category: "Business",
  authors: [{ name: "AgroTrade", url: BASE_URL }],
  creator: "AgriTek by AgroTrade",
  publisher: "AgroTrade",

  // ── Open Graph ─────────────────────────────────────────────────────────────
  openGraph: {
    title: "AgriTek — The Raspberry Exception Desk",
    description:
      "A private pilot for controlled replacement-load coordination into Spain. Direct buyer-exporter trade; no AgriTek custody, title, inventory or credit.",
    url: BASE_URL,
    type: "website",
    siteName: "AgriTek by AgroTrade",
    locale: "en_US",
    images: [
      {
        url: "/og-pilot.png",
        width: 1200,
        height: 630,
        alt: "AgriTek — The Raspberry Exception Desk private pilot",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X ────────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "AgriTek — The Raspberry Exception Desk",
    description:
      "Private raspberry replacement-load pilot into Spain. Buyer contracts and pays the exporter directly.",
    images: ["/og-pilot.png"],
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
    "apple-mobile-web-app-title": "AgriTek",
    "application-name": "AgriTek",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} antialiased`}
        style={{ backgroundColor: "#0C0904", color: "#ffffff" }}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
