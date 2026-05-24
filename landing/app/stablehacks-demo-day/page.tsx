import type { Metadata } from "next";
import { StableHacksDeck } from "../components/presentation/StableHacksDeck";

export const metadata: Metadata = {
  title: "StableHacks Demo Day Deck",
  description: "Private share route for the AgroTrade StableHacks presentation.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function StableHacksDemoDayPage() {
  return <StableHacksDeck />;
}
