/**
 * Main Layout
 * 通常ページ用の共通レイアウト（Header + Footer）
 */
import { Header } from "@/widgets/header"
import { SiteFooter } from "@/widgets/site-footer"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-brand-600 focus:text-white focus:shadow-lg"
      >
        メインコンテンツへスキップ
      </a>
      <Header />
      <main id="main-content" className="flex-1 bg-surface-tertiary">{children}</main>
      <SiteFooter />
    </div>
  )
}
