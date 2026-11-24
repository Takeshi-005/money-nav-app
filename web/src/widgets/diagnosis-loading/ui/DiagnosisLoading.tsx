"use client"

/**
 * Diagnosis Loading Component
 * 診断中のローディング表示
 */
import { getResultIcon } from "@/entities/diagnosis"

export function DiagnosisLoading() {
  return (
    <div className="py-16">
      <div
        className="p-8 rounded-3xl text-center bg-surface-secondary border border-(--border-primary)"
      >
        <div className="flex justify-center mb-4">
          {getResultIcon("loading")}
        </div>
        <h2
          className="text-xl font-bold mb-2 text-foreground"
        >
          AIが診断中...
        </h2>
        <p className="text-(--text-secondary)">
          あなたにぴったりの投資スタイルを分析しています<br />
          30秒ほどお待ちください
        </p>
      </div>
    </div>
  )
}
