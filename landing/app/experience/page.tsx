import type { Metadata } from 'next';
import { ExperienceClient } from './ExperienceClient';

export const metadata: Metadata = {
  title: 'Trade Command Room — Simulated Experience',
  description:
    'Explore a synthetic AgriTek produce-trade workflow with visible ownership, evidence gates, movement milestones and release boundaries.',
  robots: { index: false, follow: false },
};

export default function ExperiencePage() {
  return <ExperienceClient />;
}
