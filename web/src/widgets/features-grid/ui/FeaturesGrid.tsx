import { FeatureCardLarge } from "./FeatureCardLarge";
import { FeatureCardSmall } from "./FeatureCardSmall";
import { FeatureCardBanner } from "./FeatureCardBanner";
import { Typography } from "@/shared/ui/typography";

export function FeaturesGrid() {
  return (
    <section aria-label="主な機能" className="py-20 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Typography variant="title_M" className="mb-4 tracking-[-0.02em]">
            投資学習を、新しいスタイルで
          </Typography>
          <Typography color="gray">
            ゲーム感覚で楽しく学べる4つの機能
          </Typography>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Feature 1 - AI診断 (Large) */}
          <FeatureCardLarge
            title="AI投資スタイル診断"
            description="9つの質問に答えるだけで、あなたの投資傾向をAIが分析。8つの投資家タイプから最適なスタイルを診断します。完全無料・登録不要。"
            href="/diagnosis?start=true"
            linkText="無料で診断を始める →"
          />

          {/* Feature 2 - ニュースクイズ */}
          <FeatureCardSmall
            title="毎日のニュースクイズ"
            description="最新の経済ニュースをクイズ形式で学習。投資判断力を鍛えましょう。"
            iconBgColor="bg-accent-100"
            iconColor="text-accent-600"
            href="/quiz"
          />

          {/* Feature 3 - おすすめ銘柄 */}
          <FeatureCardSmall
            title="おすすめ銘柄紹介"
            description="あなたの投資スタイルに合った銘柄をAIが提案します。"
            iconBgColor="bg-brand-100"
            iconColor="text-brand-600"
            href="/diagnosis?start=true"
          />

          {/* Feature 4 - レベルアップシステム (Banner) */}
          <FeatureCardBanner
            icon={
              <svg
                className="w-7 h-7 "
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            }
            title="レベルアップシステム"
            description="クイズに正解して経験値をゲット。レベルを上げて、投資知識の成長を実感しましょう。毎日の継続で、あなたの投資スキルがどんどん向上します。"
          />
        </div>
      </div>
    </section>
  );
}
