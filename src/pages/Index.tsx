import { HomeHeader } from "@/components/layout/HomeHeader";
import { HomeFooter } from "@/components/layout/HomeFooter";
import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { InteractiveFeatures } from "@/components/landing/InteractiveFeatures";
import { ForecastPreview } from "@/components/landing/ForecastPreview";
import { SupportedMarkets } from "@/components/landing/SupportedMarkets";
import { TrustBadges } from "@/components/landing/TrustBadges";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { SEO } from "@/components/seo/SEO";

const Index = () => {
  const { user } = useAuth();

  return (
    <>
      <SEO 
        title="Professional Forex Trading Platform"
        description="Access premium market forecasts, exclusive trading signals, and professional analysis. Join thousands of traders making informed decisions with ArovaForex."
      />
      
      <div className="min-h-screen bg-background">
        <HomeHeader />
        
        <HeroSection isAuthenticated={!!user} />
        <HowItWorks />
        <InteractiveFeatures />
        <ForecastPreview isAuthenticated={!!user} />
        <SupportedMarkets />
        <TrustBadges />
        <FinalCTA isAuthenticated={!!user} />
        
        <HomeFooter />
      </div>
    </>
  );
};

export default Index;
