"use client"

/**
 * Diagnosis Error Component
 * エラー表示
 */
import { getResultIcon } from "@/entities/diagnosis"

export interface DiagnosisErrorProps {
  error: string
  onRetry: () => void
}

export function DiagnosisError({ error, onRetry }: DiagnosisErrorProps) {
  return (
    <div className="py-16">
      <div className="p-8 rounded-3xl text-center bg-surface-secondary border-(--border-primary)">
        <div className="flex justify-center mb-4">
          {getResultIcon("error")}
        </div>
        <h2 className="text-xl font-bold mb-2 text-foreground">
          エラーが発生しました
        </h2>
        <p className="mb-6 text-(--text-negative)">
          {error}
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 bg-gradient-brand "
        >
          最初からやり直す
        </button>
      </div>
    </div>
  )
}
