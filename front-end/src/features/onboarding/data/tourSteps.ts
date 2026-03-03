// src/features/onboarding/data/tourSteps.ts

/**
 * SpotlightArea uses fractions (0–1) of screen dimensions.
 * null means full-screen dim with no spotlight hole.
 *
 * Positions are calibrated for the Market Intelligence (dashboard) screen.
 * Fine-tune topPct/heightPct if layout changes.
 */
export interface SpotlightArea {
  topPct: number;    // distance from top as fraction of screen height
  leftPct: number;   // distance from left as fraction of screen width
  widthPct: number;  // width as fraction of screen width
  heightPct: number; // height as fraction of screen height
}

export interface TourStep {
  title: string;
  message: string;
  spotlight: SpotlightArea | null; // null = full dim, character only
}

// ─── BUYER ───────────────────────────────────────────────────────────────────
const BUYER_STEPS: TourStep[] = [
  {
    title: 'Welcome! 👋',
    message:
      "Hey there! I'm your AgroTrade guide. Let me show you around — it'll take less than a minute!",
    spotlight: null,
  },
  {
    title: 'Live Market Prices 📊',
    message:
      'These are live commodity prices. They refresh every 15 minutes so you always have the latest data.',
    spotlight: { topPct: 0.1, leftPct: 0, widthPct: 1, heightPct: 0.3 },
  },
  {
    title: 'Agricultural News 📰',
    message:
      'Stay ahead of the market with curated agricultural news. Tap any article to read more.',
    spotlight: { topPct: 0.42, leftPct: 0, widthPct: 1, heightPct: 0.22 },
  },
  {
    title: 'Price Alerts 🔔',
    message:
      "Set a target price and we'll notify you when the market hits it. Tap '+ ADD' to create your first alert.",
    spotlight: { topPct: 0.65, leftPct: 0, widthPct: 1, heightPct: 0.22 },
  },
  {
    title: "You're all set! 🎉",
    message: 'Use the tabs below to browse products, place orders, and manage your profile. Happy buying!',
    spotlight: { topPct: 0.88, leftPct: 0, widthPct: 1, heightPct: 0.12 },
  },
];

// ─── SELLER ──────────────────────────────────────────────────────────────────
const SELLER_STEPS: TourStep[] = [
  {
    title: 'Welcome, Seller! 🌱',
    message:
      "I'm your AgroTrade guide. Let me give you a quick tour of your selling dashboard!",
    spotlight: null,
  },
  {
    title: 'Market Prices 📊',
    message:
      'Check current commodity prices here. Use these to price your products competitively and maximise margins.',
    spotlight: { topPct: 0.1, leftPct: 0, widthPct: 1, heightPct: 0.3 },
  },
  {
    title: 'Market News 📰',
    message:
      'Stay informed about supply/demand trends. News affects prices — read it before listing.',
    spotlight: { topPct: 0.42, leftPct: 0, widthPct: 1, heightPct: 0.22 },
  },
  {
    title: 'Price Alerts 🔔',
    message:
      "Get notified when prices hit your target. Great for timing when to list your produce.",
    spotlight: { topPct: 0.65, leftPct: 0, widthPct: 1, heightPct: 0.22 },
  },
  {
    title: "Let's sell! 🎉",
    message:
      'Navigate with the tabs below to list your products and manage incoming orders. Go get that bread!',
    spotlight: { topPct: 0.88, leftPct: 0, widthPct: 1, heightPct: 0.12 },
  },
];

// ─── TRANSPORTER ─────────────────────────────────────────────────────────────
const TRANSPORT_STEPS: TourStep[] = [
  {
    title: 'Welcome, Driver! 🚛',
    message:
      "I'm your AgroTrade guide. Let me show you how to find jobs and grow your logistics business!",
    spotlight: null,
  },
  {
    title: 'Market Intelligence 📊',
    message:
      'Track commodity price movements here. High-value commodities moving means more transport demand.',
    spotlight: { topPct: 0.1, leftPct: 0, widthPct: 1, heightPct: 0.3 },
  },
  {
    title: 'Industry News 📰',
    message:
      'Follow agricultural news to anticipate where goods will be moving before jobs even get posted.',
    spotlight: { topPct: 0.42, leftPct: 0, widthPct: 1, heightPct: 0.22 },
  },
  {
    title: 'Price Alerts 🔔',
    message:
      "Set alerts for commodities in your region. Price spikes often mean urgent transport needs.",
    spotlight: { topPct: 0.65, leftPct: 0, widthPct: 1, heightPct: 0.22 },
  },
  {
    title: "Hit the road! 🎉",
    message:
      'Use the tabs below to browse available transport jobs, manage your routes, and update your profile.',
    spotlight: { topPct: 0.88, leftPct: 0, widthPct: 1, heightPct: 0.12 },
  },
];

// ─── EXPORT ──────────────────────────────────────────────────────────────────
export const TOUR_STEPS: Record<'buyer' | 'seller' | 'transport', TourStep[]> = {
  buyer: BUYER_STEPS,
  seller: SELLER_STEPS,
  transport: TRANSPORT_STEPS,
};
