import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Providers } from './providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const BASE_URL = 'https://agrotrade.africa';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Primary ────────────────────────────────────────────────────────────────
  title: {
    default: 'AgriTek — Trade Operating System',
    template: '%s | AgriTek',
  },
  description:
    'One evidence-backed workflow for cross-border produce trade—from buyer requirement and supply readiness to inspection, movement, acceptance and claims.',

  // ── Canonical ──────────────────────────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
  },

  // ── Discovery ──────────────────────────────────────────────────────────────
  keywords: [
    'agricultural trade operating system',
    'cross-border produce trade',
    'agricultural supply chain evidence',
    'produce trade workflow',
    'Morocco Portugal Spain trade corridor',
    'raspberry supply exception',
    'fresh produce exception desk',
    'raspberry replacement load',
    'Morocco Spain raspberry import',
    'Portugal Spain raspberry supply',
    'produce document gate',
    'cold chain evidence',
    'arrival inspection coordination',
  ],
  category: 'Business',
  authors: [{ name: 'AgroTrade', url: BASE_URL }],
  creator: 'AgriTek by AgroTrade',
  publisher: 'AgroTrade',

  // ── Open Graph ─────────────────────────────────────────────────────────────
  openGraph: {
    title: 'AgriTek — Move Food. Move Trust.',
    description:
      'The evidence-backed operating workflow for every critical handoff in cross-border produce trade. Starting with a private Morocco/Portugal-to-Spain raspberry pilot.',
    url: BASE_URL,
    type: 'website',
    siteName: 'AgriTek by AgroTrade',
    locale: 'en_US',
    images: [
      {
        url: '/visuals/agritek-cold-chain-hero.jpg',
        width: 1808,
        height: 870,
        alt: 'AgriTek cold-chain operators preparing a raspberry trade corridor',
        type: 'image/jpeg',
      },
    ],
  },

  // ── Twitter / X ────────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: 'AgriTek — Move Food. Move Trust.',
    description: 'One operating record for the critical handoffs in cross-border produce trade.',
    images: ['/visuals/agritek-cold-chain-hero.jpg'],
    // site: "@agrotrade",  // uncomment once handle is live
  },

  // ── Icons ──────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [{ rel: 'mask-icon', url: '/logo.png' }],
  },

  // ── PWA / theme colour ─────────────────────────────────────────────────────
  // Note: manifest.ts handles the full PWA manifest at /manifest.json
  // This sets the browser chrome colour on mobile
  other: {
    'theme-color': '#070907',
    'color-scheme': 'dark',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'AgriTek',
    'application-name': 'AgriTek',
    'msapplication-TileColor': '#0C0904',
    'msapplication-TileImage': '/icon-192.png',
  },

  // ── Crawling ───────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
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
        style={{ backgroundColor: '#070907', color: '#ffffff' }}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
