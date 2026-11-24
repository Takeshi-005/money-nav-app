"use client"

/**
 * Recommended Sectors Component
 * おすすめセクターリスト
 */

export interface RecommendedSectorsProps {
  sectors: string[]
}

export function RecommendedSectors({ sectors }: RecommendedSectorsProps) {
  if (!sectors || sectors.length === 0) {return null}

  return (
    <div className="p-6 rounded-3xl mb-6 bg-surface-secondary border border-(--border-primary)">
      <h2
        className="text-lg font-bold mb-4 text-foreground"
      >
        おすすめセクター
      </h2>
      <div className="flex flex-wrap gap-2">
        {sectors.map((sector, index) => (
          <span
            key={index}
            className="px-4 py-2 rounded-full text-sm font-medium bg-brand-100 text-brand-700"
          >
            {sector}
          </span>
        ))}
      </div>
    </div>
  )
}
