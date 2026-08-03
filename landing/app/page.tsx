import { Navbar } from './components/sections/Navbar';
import { GlobalHero } from './components/sections/GlobalHero';
import { ProblemSection } from './components/sections/ProblemSection';
import { CorridorControlSection } from './components/sections/CorridorControlSection';
import { TradeStackSection } from './components/sections/TradeStackSection';
import { HowItWorks } from './components/sections/HowItWorks';
import { RoleJourneysSection } from './components/sections/RoleJourneysSection';
import { ReadinessLedger } from './components/sections/ReadinessLedger';
import { MissionSection } from './components/sections/MissionSection';
import { CtaFooter } from './components/sections/CtaFooter';
import { JsonLd } from './components/JsonLd';

export default function LandingPage() {
  return (
    <main id="main-content" style={{ backgroundColor: '#070907' }}>
      <JsonLd />
      <Navbar />
      <GlobalHero />
      <ProblemSection />
      <CorridorControlSection />
      <TradeStackSection />
      <HowItWorks />
      <RoleJourneysSection />
      <ReadinessLedger />
      <MissionSection />
      <CtaFooter />
    </main>
  );
}
