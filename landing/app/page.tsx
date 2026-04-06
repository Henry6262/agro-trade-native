import { Navbar } from "./components/sections/Navbar";
import { Hero } from "./components/sections/Hero";

import { GlobalReach } from "./components/sections/GlobalReach";
import { ProblemSection } from "./components/sections/ProblemSection";
import { HowItWorks } from "./components/sections/HowItWorks";
import { LiveDealFlow } from "./components/sections/LiveDealFlow";
import { RolesSection } from "./components/sections/RolesSection";
import { VaultSection } from "./components/sections/VaultSection";
import { CtaFooter } from "./components/sections/CtaFooter";
import { SectionDivider } from "./components/SectionDivider";
import { JsonLd } from "./components/JsonLd";

export default function LandingPage() {
  return (
    <main style={{ backgroundColor: "#0C0904" }}>
      <JsonLd />
      <Navbar />
      <Hero />
      <SectionDivider />
      <GlobalReach />
      <SectionDivider />
      <ProblemSection />
      <SectionDivider />
      <HowItWorks />
      <SectionDivider />
      <LiveDealFlow />
      <SectionDivider />
      <RolesSection />
      <SectionDivider />
      <VaultSection />
      <SectionDivider />
      <CtaFooter />
    </main>
  );
}
