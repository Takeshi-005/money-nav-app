"use client";

import { PageHeader } from "@/widgets/header";
import { SiteFooter } from "@/widgets/site-footer";
import { Typography } from "@/shared/ui/typography";
import { CrossLinkSection } from "@/shared/ui/cross-link-section";
import { PredictionCard } from "@/widgets/prediction-card";
import { PredictionResultCard } from "@/widgets/prediction-result-card";
import { PerformanceStats } from "@/widgets/performance-stats";
import { SocialShareButtons } from "@/shared/ui/social-share";
import { usePredictionData } from "@/features/prediction-data";
import { usePredictionSubmit } from "@/features/prediction-submit";
import type { PredictionDirection } from "@/entities/prediction";
import { BRAND } from "@/shared/config";

export function QuizPage() {
  const { data, isLoading, error } = usePredictionData();
  const { mutate: submitPrediction, isPending: isSubmitting } = usePredictionSubmit();

  const handleSubmit = (prediction: PredictionDirection) => {
    submitPrediction(prediction);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader backHref="/" title="予測トレーニング" />

      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full space-y-6">
        <div>
          <Typography variant="title_L" className="mb-2">
            予測トレーニング
          </Typography>
          <Typography variant="S" className="text-(--text-secondary)">
            毎日1問、ニュースが「プラス材料」「マイナス材料」のどちらに作用するかを予測して投資判断力を鍛えよう
          </Typography>
          <SocialShareButtons
            url={`${process.env.NEXT_PUBLIC_APP_URL}/quiz`}
            text={`毎日1問・ニュースの好/悪材料を予測して投資判断力を鍛える【${BRAND.NAME}】`}
            className="mt-4"
          />
        </div>

        {isLoading && <LoadingState />}

        {error && (
          <div className="rounded-2xl bg-surface-secondary p-6 text-center">
            <Typography variant="M" className="text-(--text-secondary)">
              データの取得に失敗しました
            </Typography>
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            {data.today ? (
              <PredictionCard
                data={data.today}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isGuest={data.isGuest}
              />
            ) : (
              <div className="rounded-2xl bg-surface-secondary p-6 text-center">
                <Typography variant="M" className="text-(--text-secondary)">
                  今日の予測問題は準備中です。しばらくお待ちください。
                </Typography>
              </div>
            )}

            <PerformanceStats
              performance={data.performance}
              isGuest={data.isGuest}
            />

            {data.yesterday && (
              <PredictionResultCard data={data.yesterday} />
            )}

            <CrossLinkSection
              links={[
                { href: "/news-articles", label: "ニュース解説を読む", emoji: "📰" },
                { href: "/tomorrow-impact", label: "明日の好悪材料を見る", emoji: "📌" },
              ]}
            />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl bg-surface-secondary p-6 animate-pulse">
          <div className="h-4 bg-surface-elevated rounded w-1/3 mb-4" />
          <div className="h-16 bg-surface-elevated rounded mb-4" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-14 bg-surface-elevated rounded-xl" />
            <div className="h-14 bg-surface-elevated rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
