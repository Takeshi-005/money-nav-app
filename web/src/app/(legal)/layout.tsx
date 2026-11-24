/**
 * Legal Layout
 * 法的ページ用の共通レイアウト（シンプルHeader + Footer）
 */
import Link from "next/link";
import { SiteFooter } from "@/widgets/site-footer";
import { Typography } from "@/shared/ui/typography";
import { TrendUp } from "@/shared/ui/icons";
import { BRAND } from "@/shared/config";

interface LegalLayoutProps {
  children: React.ReactNode;
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Simple Header for Legal Pages */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 bg-surface-secondary border-(--border-primary) shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6">
          <nav aria-label="ホームへ戻る">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-brand shadow-glow-brand transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
                <TrendUp size="lg" className="" strokeWidth={2.5} />
              </div>

              <div>
                <Typography variant="L_bold" className="tracking-tight">
                  {BRAND.NAME}
                </Typography>
                <Typography as="p" variant="caution" color="gray">
                  {BRAND.POWERED_BY}
                </Typography>
              </div>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
