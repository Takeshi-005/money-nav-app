"use client"

/**
 * Dashboard Skeleton Component
 * ダッシュボードのローディング状態
 */
export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto my-8 px-6 sm:px-8 py-8 bg-surface-secondary rounded-2xl shadow-sm">
      <div className="animate-pulse space-y-6">
        {/* ユーザー情報カードのスケルトン */}
        <div className="h-40 rounded-3xl bg-surface-secondary" />

        {/* メインコンテンツのスケルトン */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左カラム */}
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 rounded-3xl bg-surface-secondary" />
            <div className="h-48 rounded-3xl bg-surface-secondary" />
          </div>
          {/* 右カラム */}
          <div className="space-y-6">
            <div className="h-64 rounded-3xl bg-surface-secondary" />
          </div>
        </div>
      </div>
    </div>
  )
}
