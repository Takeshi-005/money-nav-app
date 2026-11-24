"use client"

/**
 * Suggested Tickers Component
 * 参考銘柄リスト
 */

export interface SuggestedTickersProps {
  tickers: {
    code: string
    name: string
    reason: string
  }[]
}

export function SuggestedTickers({ tickers }: SuggestedTickersProps) {
  if (!tickers || tickers.length === 0) {return null}

  return (
    <div className="p-6 rounded-3xl mb-6 bg-surface-secondary border border-(--border-primary)">
      <h2
        className="text-lg font-bold mb-4 text-foreground"
      >
        参考銘柄
      </h2>
      <div className="space-y-3">
        {tickers.map((ticker, index) => (
          <div
            key={index}
            className="p-4 rounded-2xl bg-surface-tertiary"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-bold text-foreground"
              >
                {ticker.name}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono bg-surface-elevated text-(--text-tertiary)"
              >
                {ticker.code}
              </span>
            </div>
            <p
              className="text-sm text-foreground"
            >
              {ticker.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
