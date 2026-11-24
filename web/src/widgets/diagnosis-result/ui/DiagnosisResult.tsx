"use client";

/**
 * Diagnosis Result Widget
 * 診断結果表示全体
 */
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/entities/session";
import type { DiagnosisAIResult } from "@/entities/diagnosis";
import { ResultHeader } from "./ResultHeader";
import { StrengthsWeaknesses } from "./StrengthsWeaknesses";
import { ActionAdvice } from "./ActionAdvice";
import { RecommendedSectors } from "./RecommendedSectors";
import { SuggestedTickers } from "./SuggestedTickers";
import { GuestCTA } from "./GuestCTA";
import { SocialShareButtons } from "@/shared/ui/social-share";
import { BRAND } from "@/shared/config";

export interface DiagnosisResultProps {
  result: DiagnosisAIResult;
  onRetry: () => void;
}

export function DiagnosisResult({ result, onRetry }: DiagnosisResultProps) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="py-8">
      <ResultHeader result={result} />

      <div className="p-6 rounded-3xl mb-6 bg-surface-secondary border border-(--border-primary)">
        <p className="text-base leading-relaxed text-(--text-secondary)">
          {result.resultText}
        </p>
        <SocialShareButtons
          url={`${process.env.NEXT_PUBLIC_APP_URL}/diagnosis/result/${result.typeCode.toLowerCase()}`}
          text={`${BRAND.NAME}のAI投資スタイル診断で「${result.investorType}」タイプでした！あなたは？`}
          className="mt-4"
        />
      </div>

      <StrengthsWeaknesses
        strengths={result.strengths}
        weaknesses={result.weaknesses}
      />

      <ActionAdvice advice={result.actionAdvice} />

      <RecommendedSectors sectors={result.recommendedSectors} />

      <SuggestedTickers tickers={result.suggestedTickers} />

      <div className="mb-6 text-center">
        <Link
          href="/investor-guides"
          className="text-sm text-(--text-tertiary) hover:text-(--text-secondary) transition-colors"
        >
          すべての投資家タイプを見る →
        </Link>
      </div>

      {!user && <GuestCTA />}

      <div className="flex gap-4 justify-center">
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 bg-surface-tertiary text-(--text-secondary) border border-(--border-primary)"
        >
          もう一度診断する
        </button>
        {user ? (
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 bg-gradient-brand "
          >
            ダッシュボードへ
          </button>
        ) : (
          <button
            onClick={() => router.push("/quiz")}
            className="px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 bg-gradient-brand "
          >
            クイズに挑戦する
          </button>
        )}
      </div>
    </div>
  );
}
