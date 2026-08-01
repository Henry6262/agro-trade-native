import { Navbar } from "./components/sections/Navbar";
import { Hero } from "./components/sections/Hero";
import { ProblemSection } from "./components/sections/ProblemSection";
import { HowItWorks } from "./components/sections/HowItWorks";
import { CtaFooter } from "./components/sections/CtaFooter";
import { SectionDivider } from "./components/SectionDivider";
import { JsonLd } from "./components/JsonLd";

export default function LandingPage() {
  return (
    <main style={{ backgroundColor: "#0C0904" }}>
      <JsonLd />
      <Navbar />
      <Hero />
      <div style={{ paddingLeft: "7.5%", paddingRight: "7.5%" }}>
        <SectionDivider />
        <ProblemSection />
        <SectionDivider />
        <HowItWorks />
        <SectionDivider />
        <CtaFooter />
      </div>
    </main>
  );
}
