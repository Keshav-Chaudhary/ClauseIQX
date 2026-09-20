import { HeroSection } from "@/components/marketing/landing/HeroSection";
import { SocialProofSection } from "@/components/marketing/landing/SocialProofSection";
import { FeatureSection } from "@/components/marketing/landing/FeatureSection";
import { AnalysisJourneySection } from "@/components/marketing/landing/AnalysisJourneySection";
import { CTASection } from "@/components/marketing/landing/CTASection";
import { MarketingFooter } from "@/components/marketing/footer/MarketingFooter";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <SocialProofSection />
      <FeatureSection />
      <AnalysisJourneySection />
      <CTASection />
      <MarketingFooter />
    </div>
  );
}
