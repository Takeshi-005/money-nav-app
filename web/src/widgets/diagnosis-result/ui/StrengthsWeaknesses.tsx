"use client"

/**
 * Strengths & Weaknesses Component
 * 強み・弱みグリッド
 */
import { getResultIcon } from "@/entities/diagnosis"

export interface StrengthsWeaknessesProps {
  strengths?: string[]
  weaknesses?: string[]
}

export function StrengthsWeaknesses({ strengths, weaknesses }: StrengthsWeaknessesProps) {
  if ((!strengths || strengths.length === 0) && (!weaknesses || weaknesses.length === 0)) {
    return null
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4 mb-6">
      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <div className="p-6 rounded-3xl bg-surface-secondary border border-(--border-primary)">

          <div className="flex items-center gap-2 mb-4">
            {getResultIcon("strength")}
            <h2
              className="text-lg font-bold text-foreground"
            >
              あなたの強み
            </h2>
          </div>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-(--text-secondary)"
              >
                <span className="text-positive">✓</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses && weaknesses.length > 0 && (
        <div className="p-6 rounded-3xl bg-surface-secondary border border-(--border-primary)">

          <div className="flex items-center gap-2 mb-4">
            {getResultIcon("warning")}
            <h2
              className="text-lg font-bold text-foreground"
            >
              注意点
            </h2>
          </div>
          <ul className="space-y-2">
            {weaknesses.map((weakness, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-(--text-secondary)"
              >
                <span className="text-warning">!</span>
                {weakness}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
