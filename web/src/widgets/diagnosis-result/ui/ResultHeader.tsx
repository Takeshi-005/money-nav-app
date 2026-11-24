"use client";

/**
 * Result Header Component
 * 診断結果のメインヘッダー（投資家アバター・タイプ名）
 */
import { InvestorAvatar, type DiagnosisAIResult } from "@/entities/diagnosis";
import { Typography } from "@/shared/ui/typography";

export interface ResultHeaderProps {
  result: DiagnosisAIResult;
}

export function ResultHeader({ result }: ResultHeaderProps) {
  return (
    <div className="relative overflow-hidden p-8 rounded-3xl mb-6 bg-gradient-brand-deep">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-pattern-dots" />

      <div className="relative text-center">
        <div className="flex justify-center mb-4">
          <InvestorAvatar
            typeCode={result.typeCode}
            investorType={result.investorType}
          />
        </div>
        <Typography variant="S" className="text-white/80 mb-2">
          あなたの投資家タイプは...
        </Typography>
        <Typography variant="title_L" className="text-3xl sm:text-4xl mb-3">
          {result.investorType}
        </Typography>
        {result.famousQuote && (
          <Typography variant="S" className="text-white/70 italic">
            「{result.famousQuote}」
          </Typography>
        )}
      </div>
    </div>
  );
}
