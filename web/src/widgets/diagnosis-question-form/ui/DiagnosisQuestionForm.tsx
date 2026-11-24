"use client"

/**
 * Diagnosis Question Form Widget
 * 質問フォーム全体
 */
import { type Step, TOTAL_STEPS, questions } from "@/entities/diagnosis"
import { DiagnosisProgress } from "./DiagnosisProgress"
import { QuestionCard } from "./QuestionCard"

export interface DiagnosisQuestionFormProps {
  step: Step
  onSelect: (value: string) => void
  onBack: () => void
}

export function DiagnosisQuestionForm({
  step,
  onSelect,
  onBack,
}: DiagnosisQuestionFormProps) {
  const currentQuestion = questions[step]
  const progress = ((step - 1) / TOTAL_STEPS) * 100

  return (
    <div className="py-8">
      <DiagnosisProgress step={step} progress={progress} />

      <QuestionCard
        question={currentQuestion}
        step={step}
        onSelect={onSelect}
        onBack={onBack}
      />
    </div>
  )
}
