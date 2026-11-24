import type { Metadata } from "next";
import { AIDisclosureBanner } from "@/shared/ui/ai-disclosure-banner";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Typography } from "@/shared/ui/typography";
import { AUTHOR, BRAND } from "@/shared/config";
import { getBaseUrl } from "@/shared/lib/structured-data";

export const metadata: Metadata = {
  title: "運営者情報",
  description: `${BRAND.NAME}のサービス概要と運営者情報。投資スタイル診断・デイリークイズ・市場解説など、AIを活用した投資学習サービスの理念と主要機能をご紹介します。個人運営で2025年1月にサービス開始しました。`,
};

export default function AboutPage() {
  const breadcrumbItems = [
    { label: "ホーム", href: "/" },
    { label: "運営者情報" },
  ];

  const baseUrl = getBaseUrl();
  const personData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: AUTHOR.NAME,
    jobTitle: AUTHOR.TITLE,
    description: AUTHOR.BIO,
    url: `${baseUrl}/about`,
    sameAs: [BRAND.X_URL],
    worksFor: { "@type": "Organization", name: BRAND.NAME, url: baseUrl },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personData) }}
      />
      <Breadcrumbs items={breadcrumbItems} className="max-w-3xl mx-auto px-4" />
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6">
        {/* Title Section */}
        <div className="mb-10">
          <Typography variant="title_S" as="h1" className="sm:text-3xl mb-3 text-foreground">
            運営者情報
          </Typography>
          <Typography variant="S">最終更新日: 2025年1月15日</Typography>
        </div>

        {/* Content Area */}
        <article className="prose prose-lg max-w-none text-(--text-secondary)">
          {/* Service Overview */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              {BRAND.NAME}について
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                {BRAND.NAME}は、投資初心者の方々が楽しみながら金融リテラシーを身につけられるよう設計された、
                AI活用型の投資学習サービスです。
              </Typography>

              <div className="rounded-xl p-6 bg-linear-to-br border border-brand-200">
                <Typography variant="M_bold" className="mb-3 text-brand-700">
                  サービスの理念
                </Typography>
                <Typography
                  variant="S"
                  className="leading-relaxed text-brand-800"
                >
                  「投資は怖い」「難しそう」というイメージを払拭し、
                  クイズや診断を通じて投資の基礎を楽しく学べる環境を提供することを目指しています。
                </Typography>
              </div>
            </div>
          </section>

          {/* Main Features */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              主な機能
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Feature 1 */}
              <div className="rounded-lg p-4 bg-surface-tertiary border border-(--border-primary)">
                <div className="text-2xl mb-2">🎯</div>
                <Typography variant="S_bold" className="mb-1">
                  投資スタイル診断
                </Typography>
                <Typography variant="caution" color="gray">
                  9つの質問から、あなたに合った投資スタイルを分析します
                </Typography>
              </div>

              {/* Feature 2 */}
              <div className="rounded-lg p-4 bg-surface-tertiary border border-(--border-primary)">
                <div className="text-2xl mb-2">📝</div>
                <Typography variant="S_bold" className="mb-1">
                  デイリークイズ
                </Typography>
                <Typography variant="caution" color="gray">
                  毎日3問のクイズで投資知識を楽しく学べます
                </Typography>
              </div>

              {/* Feature 3 */}
              <div className="rounded-lg p-4 bg-surface-tertiary border border-(--border-primary)">
                <div className="text-2xl mb-2">🎮</div>
                <Typography variant="S_bold" className="mb-1">
                  ゲーミフィケーション
                </Typography>
                <Typography variant="caution" color="gray">
                  経験値やレベルアップで継続学習をサポートします
                </Typography>
              </div>
            </div>
          </section>

          {/* AI Content Disclosure */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              コンテンツの作成について
            </h2>

            <div className="space-y-4">
              <AIDisclosureBanner />

              <div className="rounded-lg p-4 bg-surface-tertiary border border-(--border-primary)">
                <Typography variant="S_bold" className="mb-3">
                  コンテンツ生成プロセス
                </Typography>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Google Gemini AIによるコンテンツ生成</li>
                  <li>運営者による内容の確認・レビュー</li>
                  <li>ユーザーフィードバックに基づく継続的改善</li>
                </ol>
              </div>

              <div className="rounded-lg p-4 border ">
                <h3 className="font-semibold text-sm mb-2">
                  専門家監修について
                </h3>
                <Typography
                  variant="S"
                  className="leading-relaxed text-(--color-warning-700)"
                >
                  現時点では、金融の専門家（ファイナンシャルプランナー、証券アナリスト等）による監修は行っておりません。
                  本サービスは「投資教育」を目的とした学習ツールであり、投資助言や金融商品の勧誘を目的としたものではありません。
                  投資に関する重要な判断を行う際は、必ず金融の専門家にご相談ください。
                </Typography>
              </div>
            </div>
          </section>

          {/* Operator Profile */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              運営者プロフィール
            </h2>

            <div className="rounded-xl p-6 bg-surface-tertiary border border-(--border-primary)">
              <Typography variant="M_bold" className="mb-1">
                {AUTHOR.NAME}
              </Typography>
              <Typography variant="caution" color="gray" className="mb-3">
                {AUTHOR.TITLE}
              </Typography>
              <Typography variant="S" className="leading-relaxed">
                {AUTHOR.BIO}
              </Typography>
            </div>
          </section>

          {/* Operator Information */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              運営者情報
            </h2>

            <div className="rounded-lg overflow-hidden bg-surface-tertiary border border-(--border-primary)">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-(--border-primary)">
                    <th className="text-left px-4 py-3 font-medium bg-surface-secondary text-(--text-secondary) w-[30%]">
                      運営者
                    </th>
                    <td className="px-4 py-3 text-foreground">{AUTHOR.NAME}</td>
                  </tr>
                  <tr className="border-b border-(--border-primary)">
                    <th className="text-left px-4 py-3 font-medium bg-surface-secondary text-(--text-secondary)">
                      運営形態
                    </th>
                    <td className="px-4 py-3 text-foreground">個人運営</td>
                  </tr>
                  <tr className="border-b border-(--border-primary)">
                    <th className="text-left px-4 py-3 font-medium bg-surface-secondary text-(--text-secondary)">
                      サービス名
                    </th>
                    <td className="px-4 py-3 text-foreground">
                      {BRAND.NAME}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-left px-4 py-3 font-medium bg-surface-secondary text-(--text-secondary)">
                      サービス開始
                    </th>
                    <td className="px-4 py-3 text-foreground">2025年1月</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Service History */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              サービス更新履歴
            </h2>

            <div className="space-y-3">
              <div className="flex gap-4 items-start p-3 rounded-lg bg-surface-tertiary">
                <span className="text-xs font-mono px-2 py-1 rounded bg-surface-secondary text-(--text-tertiary)">
                  2025/01
                </span>
                <div>
                  <Typography variant="S_bold">サービス開始</Typography>
                  <Typography
                    variant="caution"
                    color="gray"
                    className="leading-relaxed"
                  >
                    投資スタイル診断、デイリークイズ機能をリリース
                  </Typography>
                </div>
              </div>
            </div>
          </section>

          {/* Related Pages */}
          <section>
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              関連ページ
            </h2>

            <div className="flex flex-wrap gap-3">
              <a
                href="/terms"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-surface-tertiary text-foreground border border-(--border-primary)"
              >
                利用規約
              </a>
              <a
                href="/privacy"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-surface-tertiary text-foreground border border-(--border-primary)"
              >
                プライバシーポリシー
              </a>
              <a
                href="/disclaimer"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-surface-tertiary text-foreground border border-(--border-primary)"
              >
                免責事項
              </a>
            </div>
          </section>
        </article>
      </div>
    </>
  );
}
