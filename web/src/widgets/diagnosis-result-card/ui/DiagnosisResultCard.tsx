"use client";

/**
 * Diagnosis Result Card Widget
 * 診断結果表示カード
 */
import Link from "next/link";
import { InvestorAvatar, type DiagnosisAIResult } from "@/entities/diagnosis";
import { Typography } from "@/shared/ui/typography";
import { IconContainer } from "@/shared/ui/icon-container";

export interface DiagnosisResultCardProps {
  diagnosis: DiagnosisAIResult;
}

export function DiagnosisResultCard({ diagnosis }: DiagnosisResultCardProps) {
  return (
    <div className="p-5 rounded-3xl bg-surface-secondary border border-(--border-primary) shadow-md">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-5">
        <IconContainer size="md" rounded="md" bgColor="accent">
          <svg
            className="w-5 h-5 text-(--color-accent-600)"
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
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </IconContainer>
        <Typography variant="L_bold">診断結果</Typography>
      </div>

      {/* 投資家タイプ */}
      <div className="flex items-center gap-3 p-3 mb-5 rounded-2xl bg-gradient-brand">
        <InvestorAvatar
          typeCode={diagnosis.typeCode}
          investorType={diagnosis.investorType}
          size="sm"
        />
        <span className="text-lg font-bold ">{diagnosis.investorType}</span>
      </div>

      <Typography variant="S" className="mb-5 leading-relaxed">
        {diagnosis.resultText}
      </Typography>

      {/* 推奨セクター */}
      <div className="mb-5">
        <Typography variant="S_bold" className="mb-2 tracking-wide" as="h3">
          おすすめセクター
        </Typography>
        <div className="flex flex-wrap gap-2">
          {diagnosis.recommendedSectors.slice(0, 3).map((sector, index) => (
            <span
              key={index}
              className="px-3 py-1 rounded-lg text-sm font-medium bg-surface-tertiary text-(--text-secondary)"
            >
              {sector}
            </span>
          ))}
        </div>
      </div>

      {/* 推奨銘柄 */}
      {diagnosis.suggestedTickers && diagnosis.suggestedTickers.length > 0 && (
        <div className="mb-5">
          <Typography variant="caution" className="mb-2">
            参考銘柄
          </Typography>
          <div className="space-y-2">
            {diagnosis.suggestedTickers.slice(0, 2).map((ticker, index) => (
              <div key={index} className="p-3 rounded-xl bg-surface-tertiary">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground">
                    {ticker.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-elevated text-(--text-tertiary)">
                    {ticker.code}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 再診断ボタン */}
      <Link
        href="/diagnosis?start=true"
        className="block w-full text-center text-sm font-medium px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] bg-surface-tertiary text-(--text-brand)"
      >
        もう一度診断する
      </Link>
    </div>
  );
}
