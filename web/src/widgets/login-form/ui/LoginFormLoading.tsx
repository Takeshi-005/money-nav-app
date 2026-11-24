/**
 * ログインフォーム ローディングスケルトン
 */
import { Typography } from "@/shared/ui/typography"
import { BRAND } from "@/shared/config"

export function LoginFormLoading() {
  return (
    <div className="p-8 rounded-xl border bg-surface-secondary border-(--border-primary)">
      <Typography variant="title_S" as="h1" className="text-center mb-2 text-foreground">
        ログイン
      </Typography>
      <p className="text-center mb-6 text-(--text-tertiary)">
        {BRAND.NAME}へようこそ
      </p>
      <div className="w-full h-12 rounded-lg animate-pulse bg-surface-tertiary" />
    </div>
  )
}
