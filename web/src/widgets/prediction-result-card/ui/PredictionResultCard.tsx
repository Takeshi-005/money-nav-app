import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";
import type { YesterdayResultData } from "@/entities/prediction";

interface PredictionResultCardProps {
  data: YesterdayResultData;
}

export function PredictionResultCard({ data }: PredictionResultCardProps) {
  const isUp = data.actualMovement === "up";
  const hasUserPrediction = data.userPrediction !== undefined;
  const isCorrect = data.isCorrect;

  return (
    <div className="rounded-2xl bg-surface-secondary p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Typography variant="title_SS">昨日の結果</Typography>
        <Typography variant="caution" className="text-(--text-secondary)">
          {data.date}
        </Typography>
      </div>

      <div
        className={cn(
          "rounded-xl p-4 flex items-center gap-3",
          isUp ? "bg-positive-50" : "bg-negative-50",
        )}
      >
        <span className="text-3xl">{isUp ? "📈" : "📉"}</span>
        <Typography
          variant="L_bold"
          className={isUp ? "text-positive-600" : "text-negative-600"}
        >
          {isUp ? "プラス材料" : "マイナス材料"}
        </Typography>
      </div>

      {hasUserPrediction && (
        <div
          className={cn(
            "rounded-xl p-4 flex items-center gap-2",
            isCorrect ? "bg-positive-50" : "bg-negative-50",
          )}
        >
          <span>{isCorrect ? "✅" : "❌"}</span>
          <Typography
            variant="M_bold"
            className={isCorrect ? "text-positive-600" : "text-negative-600"}
          >
            {isCorrect ? "正解！" : "不正解"}
          </Typography>
        </div>
      )}

      {data.explanation && (
        <div className="space-y-1">
          <Typography variant="S_bold" className="text-(--text-secondary)">
            解説
          </Typography>
          <Typography variant="S" className="text-foreground leading-relaxed">
            {data.explanation}
          </Typography>
        </div>
      )}
    </div>
  );
}
