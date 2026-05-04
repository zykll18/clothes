import BrandStatementSection from "@/components/home/BrandStatementSection";
import CapabilityCardsSection from "@/components/home/CapabilityCardsSection";
import ClosingCtaSection from "@/components/home/ClosingCtaSection";
import HeroSection from "@/components/home/HeroSection";
import HomeNavbar from "@/components/home/HomeNavbar";
import HowItWorksSection from "@/components/home/HowItWorksSection";

export default function Home() {
  return (
    <main className="lux-page relative overflow-x-hidden text-white">
      <HomeNavbar />
      <HeroSection />
      <BrandStatementSection />
      <HowItWorksSection />
      <CapabilityCardsSection />
      <ClosingCtaSection />
    </main>
  );
}
