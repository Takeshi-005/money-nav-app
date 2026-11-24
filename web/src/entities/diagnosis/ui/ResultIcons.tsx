"use client"

/**
 * Diagnosis Entity - Result Icons
 * 結果表示用アイコン群
 */

/** 結果用アイコンキー */
export type ResultIconKey = "trophy" | "strength" | "warning" | "target" | "loading" | "error"

/** 結果用アイコンコンポーネント */
export const resultIcons: Record<ResultIconKey, React.ReactNode> = {
  trophy: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" fill="var(--color-accent-500)" fillOpacity="0.2" />
    </svg>
  ),
  strength: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-positive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c4-3 8-6 8-11a8 8 0 0 0-16 0c0 5 4 8 8 11z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  warning: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  target: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  loading: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  error: (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-negative)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
    </svg>
  ),
}

/** 結果用アイコンを取得 */
export function getResultIcon(key: ResultIconKey): React.ReactNode {
  return resultIcons[key]
}
