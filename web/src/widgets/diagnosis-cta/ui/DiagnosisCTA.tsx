"use client"

/**
 * Diagnosis CTA Widget
 * 診断開始を促すCTAカード
 */
import Link from "next/link"
import { Typography } from "@/shared/ui/typography"

export function DiagnosisCTA() {
  return (
    <Link
      href="/diagnosis?start=true"
      className="block p-6 rounded-3xl transition-all duration-300 hover:scale-[1.02] group bg-gradient-brand shadow-(--shadow-glow-brand)"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-white/20">
        <svg
          className="w-6 h-6 "
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </div>
      <h2 className="text-xl font-bold  mb-2 tracking-[-0.01em]">
        無料で投資スタイル診断
      </h2>
      <Typography variant="S" className="text-white/80 mb-4">
        9つの質問に答えて、あなたにぴったりの投資スタイルを見つけましょう。登録不要・5分で完了。
      </Typography>
      <span className="inline-flex items-center gap-2  font-medium group-hover:gap-3 transition-all">
        今すぐ無料で始める
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  )
}
