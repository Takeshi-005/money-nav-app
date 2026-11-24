import Link from "next/link";
import { AIDisclosureBanner } from "@/shared/ui/ai-disclosure-banner";
import { Typography } from "@/shared/ui/typography";
import {
  BRAND,
  FOOTER_LEGAL_LINKS,
  FOOTER_SERVICE_LINKS,
  NAVIGATION_PATHS,
} from "@/shared/config";

const DISCLAIMER =
  "本サービスは投資教育を目的としており、特定の金融商品の勧誘や売買の推奨を行うものではありません。投資に関する最終決定はご自身の判断で行ってください。";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-10 border-t border-(--border-primary) bg-surface-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section: Logo and Links */}
        <div className="grid gap-8 md:grid-cols-3 mb-8">
          {/* Brand Section */}
          <div>
            <Link
              href={NAVIGATION_PATHS.ROOT}
              className="flex items-center gap-3 mb-3"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-brand">
                <svg
                  className="w-4 h-4 "
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
                  <polyline points="16,7 22,7 22,13" />
                </svg>
              </div>
              <span className="font-semibold text-foreground">
                {BRAND.NAME}
              </span>
            </Link>
            <Typography variant="caution" color="gray">
              {BRAND.TAGLINE}
              <br />
              {BRAND.DESCRIPTION_SHORT}
            </Typography>
          </div>

          {/* Service Links */}
          <nav aria-label="サービスナビゲーション">
            <h3 className="font-semibold text-sm mb-3 text-foreground">
              サービス
            </h3>
            <ul className="space-y-2">
              {FOOTER_SERVICE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:underline text-(--text-secondary)"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal Links */}
          <nav aria-label="法的情報ナビゲーション">
            <h3 className="font-semibold text-sm mb-3 text-foreground">
              法的情報
            </h3>
            <ul className="space-y-2">
              {FOOTER_LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:underline text-(--text-secondary)"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* AI Disclosure Banner */}
        <div className="mb-6">
          <AIDisclosureBanner variant="compact" />
        </div>

        {/* Bottom Section: Disclaimer and Copyright */}
        <div className="pt-6 border-t border-(--border-primary)">
          <Typography
            variant="caution"
            color="muted"
            className="text-center mb-4 leading-relaxed max-w-2xl mx-auto block"
          >
            {DISCLAIMER}
          </Typography>
          <Typography variant="caution" color="muted" className="text-center">
            © {currentYear} {BRAND.NAME}. All rights reserved.
          </Typography>
        </div>
      </div>
    </footer>
  );
}
