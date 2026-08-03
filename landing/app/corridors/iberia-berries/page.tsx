import type { Metadata } from 'next';
import { Navbar } from '../../components/sections/Navbar';
import { Hero } from '../../components/sections/Hero';
import { HowItWorks } from '../../components/sections/HowItWorks';
import { ReadinessLedger } from '../../components/sections/ReadinessLedger';
import { CtaFooter } from '../../components/sections/CtaFooter';

export const metadata: Metadata = {
  title: 'Iberia Berry Corridor — Private Pilot',
  description:
    'Controlled raspberry replacement-load workflow from qualified supply in Morocco or Portugal to a named Spanish buyer.',
};

export default function IberiaBerryCorridorPage() {
  return (
    <main id="main-content" className="bg-brand-bg">
      <Navbar />
      <Hero />
      <HowItWorks />
      <ReadinessLedger />
      <CtaFooter />
    </main>
  );
}
