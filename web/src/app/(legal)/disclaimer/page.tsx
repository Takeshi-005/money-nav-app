import type { Metadata } from "next";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Typography } from "@/shared/ui/typography";
import { BRAND } from "@/shared/config";

export const metadata: Metadata = {
  title: "免責事項",
  description: `${BRAND.NAME}の免責事項。本サービスは投資助言業務ではありません。AI生成コンテンツの限界、情報の正確性、投資損失に関する免責、外部リンク、サービス中断による損害について説明しています。投資判断は必ずご自身の責任で行ってください。`,
};

export default function DisclaimerPage() {
  const breadcrumbItems = [
    { label: "ホーム", href: "/" },
    { label: "免責事項" },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} className="max-w-3xl mx-auto px-4" />
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6">
        {/* Title Section */}
        <div className="mb-10">
          <Typography variant="title_S" as="h1" className="sm:text-3xl mb-3 text-foreground">
            免責事項
          </Typography>
          <Typography variant="S">最終更新日: 2026年7月9日</Typography>
        </div>

        {/* Content Area */}
        <article className="prose prose-lg max-w-none text-(--text-secondary)">
          {/* Important Notice */}
          <section className="mb-10">
            <div className="rounded-xl p-6 mb-6 text-(--color-warning-950)">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span>⚠️</span>
                【重要】投資に関する注意事項
              </h2>
              <Typography variant="S" className="leading-relaxed">
                本サービスは投資に関する教育・学習を目的として提供されており、
                金融商品取引法に基づく投資助言・投資勧誘を行うものではありません。
                本サービスで提供される情報を基に投資判断を行い、損失が発生した場合でも、
                当サービスは一切の責任を負いかねます。投資に関する最終決定は、
                必ずご自身の判断と責任において行ってください。
              </Typography>
            </div>
          </section>

          {/* AI Generated Content */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              AI生成コンテンツについて
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                本サービスで提供されるコンテンツ（投資スタイル診断、デイリークイズ等）は、Google
                Gemini AIを活用して生成されています。
              </Typography>

              <div className="rounded-lg p-4 bg-surface-tertiary border border-(--border-primary)">
                <Typography variant="S_bold" className="mb-2">
                  AIの限界について
                </Typography>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>
                    AIは完璧ではなく、生成されたコンテンツには誤りが含まれる可能性があります
                  </li>
                  <li>
                    AIの判断は過去のデータに基づいており、将来の市場動向を保証するものではありません
                  </li>
                  <li>
                    最新の市場情報や規制変更が反映されていない場合があります
                  </li>
                </ul>
              </div>

              <Typography variant="S" className="leading-relaxed">
                AIによる分析や診断結果は、あくまで参考情報としてご利用ください。
                重要な投資判断を行う際は、金融の専門家（ファイナンシャルプランナー、
                証券アナリスト等）にご相談されることを強くお勧めします。
              </Typography>
            </div>
          </section>

          {/* Information Accuracy */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              情報の正確性について
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                本サービスで提供される情報は、信頼できると判断した情報源に基づいていますが、
                その正確性、完全性、適時性を保証するものではありません。
              </Typography>

              <ul className="text-sm space-y-2 list-disc list-inside">
                <li>株価、企業情報、ニュース等は参考情報として提供されます</li>
                <li>情報は予告なく変更・更新される場合があります</li>
                <li>
                  最新かつ正確な情報については、公式な情報源でご確認ください
                </li>
              </ul>
            </div>
          </section>

          {/* Disclaimer of Liability */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              損害に関する免責
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                本サービスの利用により生じた損害について、当サービスは以下の場合を含め、
                一切の責任を負いません。
              </Typography>

              <ul className="text-sm space-y-2 list-disc list-inside">
                <li>本サービスの情報に基づく投資判断による損失</li>
                <li>サービスの中断、遅延、停止による損害</li>
                <li>データの消失、改ざん、漏洩による損害</li>
                <li>第三者による不正アクセス、ウイルス感染等による損害</li>
                <li>その他、本サービスに関連して生じた直接的・間接的損害</li>
              </ul>
            </div>
          </section>

          {/* Affiliate Ads */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              アフィリエイト広告について
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                本サービスは、第三者が提供するアフィリエイトプログラムを利用しており、
                掲載する広告・リンクを経由して商品やサービスが購入・申込された場合、
                提携事業者から成果報酬を得ることがあります。
              </Typography>

              <Typography variant="S" className="leading-relaxed">
                広告・アフィリエイトリンクである箇所には、その旨がわかるよう「PR」等の表記を行います。
                提携先で提供される商品・サービスの内容、価格、取引条件については、
                各提携先の情報を必ずご自身でご確認ください。これらに起因する損害について、
                当サービスは一切の責任を負いません。
              </Typography>
            </div>
          </section>

          {/* External Links */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              外部リンクについて
            </h2>

            <Typography variant="S" className="leading-relaxed">
              本サービスには、第三者が運営するウェブサイトへのリンクが含まれる場合があります。
              これらの外部サイトの内容、プライバシーポリシー、安全性について、
              当サービスは一切の責任を負いません。外部サイトの利用は、
              ご自身の責任において行ってください。
            </Typography>
          </section>

          {/* Changes to Disclaimer */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              免責事項の変更
            </h2>

            <Typography variant="S" className="leading-relaxed">
              当サービスは、必要に応じて本免責事項を変更することがあります。
              変更後の免責事項は、本ページに掲載した時点から効力を生じるものとします。
              定期的に本ページをご確認いただくことをお勧めします。
            </Typography>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              お問い合わせ
            </h2>

            <Typography variant="S" className="leading-relaxed">
              本免責事項に関するお問い合わせは、
              <a href="/about" className="underline text-brand-500">
                運営者情報ページ
              </a>
              に記載の連絡先までお願いいたします。
            </Typography>
          </section>
        </article>
      </div>
    </>
  );
}
