import type { Metadata } from "next"
import { BRAND } from "@/shared/config"

export const metadata: Metadata = {
  title: "ログイン | Googleアカウントで簡単ログイン",
  description: `${BRAND.NAME}にGoogleアカウントでログイン。診断結果の保存、クイズ履歴の管理、レベルアップ機能が利用できます。ゲストユーザーでも一部機能をお試しいただけます。`,
  robots: {
    index: false,
    follow: true,
  },
}

/**
 * ログインページ
 * Googleアカウントでのログイン
 */
export { LoginPage as default } from "@/views/login"
