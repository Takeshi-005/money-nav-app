"use client";

/**
 * Question Card Component
 * 質問カード
 */
import {
  type Step,
  type Question,
  getDiagnosisIcon,
} from "@/entities/diagnosis";
import { OptionButton } from "./OptionButton";
import { Typography } from "@/shared/ui/typography";

export interface QuestionCardProps {
  question: Question;
  step: Step;
  onSelect: (value: string) => void;
  onBack: () => void;
}

export function QuestionCard({
  question,
  step,
  onSelect,
  onBack,
}: QuestionCardProps) {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-surface-secondary border border-(--border-primary)">
      <Typography as="h2" variant="L2" className="mb-1">
        {question.title}
      </Typography>
      <Typography variant="L" className="mb-6">
        {question.description}
      </Typography>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option) => (
          <OptionButton
            key={option.value}
            label={option.label}
            icon={getDiagnosisIcon(option.iconKey)}
            onClick={() => onSelect(option.value)}
          />
        ))}
      </div>

      {/* Back Button */}
      {step > 1 && (
        <button
          onClick={onBack}
          className="mt-5 cursor-pointer flex items-center gap-2 transition-all duration-200 hover:opacity-80"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <Typography variant="S">前の質問に戻る</Typography>
        </button>
      )}
    </div>
  );
}
