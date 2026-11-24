import { cn } from "@/shared/lib/utils";
import { Typography } from "@/shared/ui/typography";
import type { RoadmapStageView } from "@/entities/roadmap";
import type { RoadmapProgress } from "@/entities/roadmap";

interface RoadmapStepperProps {
  progress: RoadmapProgress;
  onReportAccountOpened: () => void;
  onReportFirstPurchase: () => void;
}

export function RoadmapStepper({
  progress,
  onReportAccountOpened,
  onReportFirstPurchase,
}: RoadmapStepperProps) {
  return (
    <ol className="space-y-3">
      {progress.stages.map((stage) => (
        <StageRow
          key={stage.id}
          stage={stage}
          onReportAccountOpened={onReportAccountOpened}
          onReportFirstPurchase={onReportFirstPurchase}
        />
      ))}
    </ol>
  );
}

interface StageRowProps {
  stage: RoadmapStageView;
  onReportAccountOpened: () => void;
  onReportFirstPurchase: () => void;
}

function StageRow({
  stage,
  onReportAccountOpened,
  onReportFirstPurchase,
}: StageRowProps) {
  const isCompleted = stage.status === "completed";
  const isCurrent = stage.status === "current";
  const isUpcoming = stage.status === "upcoming";

  return (
    <li
      className={cn(
        "rounded-xl border p-4 transition",
        isCurrent && "border-brand-500 bg-surface-elevated shadow-sm",
        isCompleted && "border-(--border-primary) bg-surface-tertiary",
        isUpcoming && "border-(--border-primary) opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            isCompleted && "bg-brand-500 text-white",
            isCurrent && "bg-brand-100 text-brand-600",
            isUpcoming && "bg-surface-tertiary text-(--text-tertiary)",
          )}
          aria-hidden
        >
          {isCompleted ? "✓" : stage.order}
        </span>

        <div className="flex-1">
          <Typography variant="M_bold" className="text-foreground">
            {stage.label}
          </Typography>

          {isCurrent && (
            <div className="mt-2 space-y-2">
              <Typography variant="S" className="text-(--text-secondary)">
                {stage.anxiety}
              </Typography>
              <Typography variant="S_bold" className="text-brand-600">
                → {stage.nudge}
              </Typography>

              {/* #20: hasReferralSlot のステージにここで証券会社リファラルを差し込む */}

              {stage.id === "account" && (
                <button
                  type="button"
                  onClick={onReportAccountOpened}
                  className="mt-1 inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
                >
                  口座を開設した！
                </button>
              )}
              {stage.id === "firstPurchase" && (
                <button
                  type="button"
                  onClick={onReportFirstPurchase}
                  className="mt-1 inline-flex items-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
                >
                  最初の1株を買った！
                </button>
              )}
            </div>
          )}

          {isCompleted && (
            <Typography variant="S" className="mt-1 text-(--text-tertiary)">
              {stage.celebrate}
            </Typography>
          )}
        </div>
      </div>
    </li>
  );
}
