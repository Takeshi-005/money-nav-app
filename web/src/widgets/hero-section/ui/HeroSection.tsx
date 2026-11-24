import { Typography } from "@/shared/ui/typography";
import { CtaButton } from "@/shared/ui/cta-button";
import { BRAND } from "@/shared/config";

export function HeroSection() {
  return (
    <section className="relative pt-8 pb-10 md:pt-10 md:pb-8">
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-30 bg-gradient-brand" />
        <div className="absolute top-1/2 -left-32 w-72 h-72 rounded-full blur-3xl opacity-20 bg-gradient-accent" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-surface-secondary border border-(--border-primary)">
            <span className="w-2 h-2 rounded-full animate-pulse bg-brand-500" />
            <Typography variant="S_bold">
              {BRAND.SUB_TAGLINE}
            </Typography>
          </div>

          <Typography variant="title_L" className="mb-4 text-foreground tracking-[-0.03em]">
            <span className="mb-2 block">
              {BRAND.NAME}
            </span>
            <span className="text-4xl sm:text-5xl md:text-6xl">
              <span className="block bg-clip-text text-transparent bg-[linear-gradient(135deg,var(--color-brand-500),var(--color-brand-600),var(--color-accent-500))]">
                {BRAND.TAGLINE}
              </span>
            </span>
            <span className="block text-sm font-normal mt-2 text-(--text-tertiary)">
              {BRAND.POWERED_BY}
            </span>
          </Typography>

          <Typography as="p" variant="S" className="max-w-2xl mx-auto mb-8">
            「投資って難しそう…」と感じているあなたへ。
            <br className="hidden sm:block" />
            AIがニュースをわかりやすく解説、毎日3問のクイズで自然と投資の感覚が身につきます。
          </Typography>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <CtaButton href="/diagnosis?start=true" variant="primary" showArrow>
              無料で診断を受ける
            </CtaButton>
            <CtaButton href="/quiz" variant="secondary">
              今日のクイズに挑戦
            </CtaButton>
          </div>

          <Typography as="p" variant="S" className="mt-6">
            登録不要で今すぐ始められます・毎日 9:00 に新しい予測問題が届きます
          </Typography>
        </div>
      </div>
    </section>
  );
}
