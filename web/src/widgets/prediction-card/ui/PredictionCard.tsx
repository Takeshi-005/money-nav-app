"use client";

import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";
import type { TodayPredictionData, PredictionDirection } from "@/entities/prediction";

interface PredictionCardProps {
  data: TodayPredictionData;
  onSubmit: (prediction: PredictionDirection) => void;
  isSubmitting: boolean;
  isGuest: boolean;
}

export function PredictionCard({
  data,
  onSubmit,
  isSubmitting,
  isGuest,
}: PredictionCardProps) {
  const hasAnswered = !!data.userPrediction;

  return (
    <div className="rounded-2xl bg-surface-secondary p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Typography variant="title_SS">今日の予測</Typography>
        <Typography variant="caution" className="text-(--text-secondary)">
          {data.date}
        </Typography>
      </div>

      <div className="bg-surface-elevated rounded-xl p-4">
        <Typography variant="S" className="text-(--text-secondary) mb-2">
          {data.contextSummary}
        </Typography>
        <Typography variant="M_bold">{data.question}</Typography>
      </div>

      {hasAnswered ? (
        <AnsweredState prediction={data.userPrediction!} />
      ) : (
        <PredictionButtons
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          isGuest={isGuest}
        />
      )}
    </div>
  );
}

function AnsweredState({ prediction }: { prediction: PredictionDirection }) {
  const isUp = prediction === "up";
  return (
    <div className="space-y-3">
      <div
        className={cn(
          "rounded-xl p-4 flex items-center gap-3",
          isUp ? "bg-positive-50" : "bg-negative-50",
        )}
      >
        <span className="text-2xl">{isUp ? "📈" : "📉"}</span>
        <div>
          <Typography variant="M_bold" className={isUp ? "text-positive-600" : "text-negative-600"}>
            {isUp ? "プラス材料と予測" : "マイナス材料と予測"}
          </Typography>
          <Typography variant="caution" className="text-(--text-secondary)">
            明日 9:00 に結果公開
          </Typography>
        </div>
      </div>
    </div>
  );
}

function PredictionButtons({
  onSubmit,
  isSubmitting,
  isGuest,
}: {
  onSubmit: (p: PredictionDirection) => void;
  isSubmitting: boolean;
  isGuest: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onSubmit("up")}
          disabled={isSubmitting || isGuest}
          className={cn(
            "rounded-xl py-4 flex flex-col items-center gap-1 transition-all",
            "bg-positive-50 hover:bg-positive-100 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <span className="text-2xl">📈</span>
          <Typography variant="M_bold" className="text-positive-600">
            プラス材料
          </Typography>
        </button>
        <button
          onClick={() => onSubmit("down")}
          disabled={isSubmitting || isGuest}
          className={cn(
            "rounded-xl py-4 flex flex-col items-center gap-1 transition-all",
            "bg-negative-50 hover:bg-negative-100 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <span className="text-2xl">📉</span>
          <Typography variant="M_bold" className="text-negative-600">
            マイナス材料
          </Typography>
        </button>
      </div>
      {isGuest && (
        <Typography variant="caution" className="text-center text-(--text-secondary)">
          予測を記録するにはログインが必要です
        </Typography>
      )}
      <Typography variant="caution" className="text-center text-(--text-secondary)">
        ⏱ 結果は明日 9:00 に公開
      </Typography>
    </div>
  );
}
