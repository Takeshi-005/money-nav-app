import { HeroSection } from "@/widgets/hero-section";
import { TodayContentSection } from "@/widgets/today-content-section";
import { FeaturesGrid } from "@/widgets/features-grid";
import { DiagnosisTypesPreviewSection } from "@/widgets/diagnosis-types-preview";
import { CTASection } from "@/widgets/cta-section";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <TodayContentSection />
      <FeaturesGrid />
      <DiagnosisTypesPreviewSection />
      <CTASection
        title="今すぐ始めよう"
        description={
          "無料で投資スタイル診断を受けて、\nあなたに合った投資スタイルを発見しましょう。"
        }
        ctaText="無料で診断を受ける"
        ctaHref="/diagnosis"
        subText="登録不要で診断・クイズが体験できます"
      />
    </>
  );
}
