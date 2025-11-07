import { SEO } from "@/components/seo/SEO";
import { AcademyHero } from "@/components/academy/AcademyHero";
import { AcademyFeatures } from "@/components/academy/AcademyFeatures";
import { CourseCurriculum } from "@/components/academy/CourseCurriculum";
import { AcademyPricing } from "@/components/academy/AcademyPricing";
import { AcademyFAQ } from "@/components/academy/AcademyFAQ";

export default function JoinAcademy() {
  return (
    <>
      <SEO 
        title="Join ArovaForex Academy - Master Forex Trading"
        description="Learn forex trading from scratch with expert mentorship. Weekly live sessions, institutional strategies, and lifetime access. Start your trading journey today."
      />
      
      <div className="min-h-screen">
        <AcademyHero />
        <AcademyFeatures />
        <CourseCurriculum />
        <AcademyPricing />
        <AcademyFAQ />
      </div>
    </>
  );
}