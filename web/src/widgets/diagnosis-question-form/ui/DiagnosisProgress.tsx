"use client"

/**
 * Diagnosis Progress Component
 * 診断進捗バー
 */
import { type Step, TOTAL_STEPS } from "@/entities/diagnosis"
import { cn } from "@/shared/lib/utils"

export interface DiagnosisProgressProps {
  step: Step
  progress: number
}

export function DiagnosisProgress({ step, progress }: DiagnosisProgressProps) {
  const steps = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1)

  return (
    <div className="mb-8">
      {/* Progress Bar Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">
          質問 {step} / {TOTAL_STEPS}
        </span>
        <span className="text-sm font-mono text-brand-500">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full overflow-hidden bg-surface-tertiary">
        <div
          className="h-full transition-all duration-500 ease-out rounded-full bg-gradient-brand-accent"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Dots */}
      <div className="flex justify-between mt-3">
        {steps.map((s) => (
          <div
            key={s}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              s < step && "bg-brand-500",
              s === step && "bg-accent-500 scale-150",
              s > step && "bg-surface-tertiary"
            )}
          />
        ))}
      </div>
    </div>
  )
}
