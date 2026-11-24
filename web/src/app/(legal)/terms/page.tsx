import type { Metadata } from "next";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Typography } from "@/shared/ui/typography";
import { BRAND } from "@/shared/config";

export const metadata: Metadata = {
  title: "利用規約",
  description: `${BRAND.NAME}のサービス利用規約。サービスの内容（投資スタイル診断・デイリークイズ）、禁止事項、免責事項、知的財産権、サービス変更・終了、準拠法について定めています。本サービスは投資助言業務ではありません。`,
};

export default function TermsPage() {
  const breadcrumbItems = [
    { label: "ホーム", href: "/" },
    { label: "利用規約" },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} className="max-w-3xl mx-auto px-4" />
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6">
        {/* Title Section */}
        <div className="mb-10">
          <Typography variant="title_S" as="h1" className="sm:text-3xl mb-3 text-foreground">
            利用規約
          </Typography>
          <Typography variant="S">最終更新日: 2025年1月15日</Typography>
        </div>

        {/* Content Area */}
        <article className="prose prose-lg max-w-none text-(--text-secondary)">
          {/* Introduction */}
          <section className="mb-10">
            <Typography variant="S" className="leading-relaxed">
              この利用規約（以下「本規約」といいます）は、{BRAND.NAME}（以下「本サービス」といいます）の利用条件を定めるものです。
              本サービスをご利用いただくにあたり、本規約に同意いただく必要があります。
            </Typography>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              第1条（適用範囲）
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                1.
                本規約は、本サービスの利用に関する当サービス運営者（以下「運営者」といいます）と利用者との間の権利義務関係を定めることを目的とし、利用者と運営者との間の本サービスの利用に関わる一切の関係に適用されます。
              </Typography>
              <Typography variant="S" className="leading-relaxed">
                2.
                運営者が本サービス上で掲載する諸規定は、本規約の一部を構成するものとします。
              </Typography>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              第2条（サービスの内容）
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                1.
                本サービスは、投資に関する教育・学習を目的として、以下の機能を提供します。
              </Typography>

              <ul className="text-sm space-y-2 list-disc list-inside pl-4">
                <li>投資スタイル診断</li>
                <li>デイリーニュースクイズ</li>
                <li>その他、投資学習に関連するコンテンツ</li>
              </ul>

              <div className="rounded-lg p-4 mt-4 bg-surface-tertiary border border-(--border-primary)">
                <Typography variant="S_bold" className="mb-2">
                  重要な注意事項
                </Typography>
                <Typography variant="S" className="leading-relaxed">
                  2.
                  本サービスは、金融商品取引法に基づく投資助言業務または投資運用業務を行うものではありません。
                  本サービスで提供される情報は、特定の金融商品の売買を推奨するものではなく、投資判断の参考情報として提供されます。
                </Typography>
              </div>

              <Typography variant="S" className="leading-relaxed">
                3.
                本サービスのコンテンツは、AI（人工知能）を活用して生成されています。
                AIによる分析・判断には限界があり、必ずしも正確性・完全性を保証するものではありません。
              </Typography>
            </div>
          </section>

          {/* Article 3 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              第3条（禁止事項）
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                利用者は、本サービスの利用にあたり、以下の行為を行ってはなりません。
              </Typography>

              <ul className="text-sm space-y-2 list-disc list-inside pl-4">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>
                  運営者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為
                </li>
                <li>本サービスの運営を妨害するおそれのある行為</li>
                <li>他の利用者に関する個人情報等を収集または蓄積する行為</li>
                <li>他の利用者に成りすます行為</li>
                <li>
                  本サービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為
                </li>
                <li>本サービスのコンテンツを無断で複製、転載、販売する行為</li>
                <li>
                  本サービスのコンテンツを投資助言として第三者に提供する行為
                </li>
                <li>その他、運営者が不適切と判断する行為</li>
              </ul>
            </div>
          </section>

          {/* Article 4 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              第4条（免責事項）
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                1.
                運営者は、本サービスで提供される情報の正確性、完全性、適時性について、いかなる保証も行いません。
              </Typography>
              <Typography variant="S" className="leading-relaxed">
                2.
                運営者は、利用者が本サービスを利用したことにより生じた損害（投資による損失を含む）について、運営者の故意または重大な過失による場合を除き、一切の責任を負いません。
              </Typography>
              <Typography variant="S" className="leading-relaxed">
                3.
                運営者は、本サービスに関して、利用者と他の利用者または第三者との間において生じた取引、連絡または紛争等について、一切責任を負いません。
              </Typography>
              <Typography variant="S" className="leading-relaxed">
                4. 詳細な免責事項については、
                <a href="/disclaimer" className="underline text-brand-500">
                  免責事項ページ
                </a>
                をご確認ください。
              </Typography>
            </div>
          </section>

          {/* Article 5 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              第5条（知的財産権）
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                1.
                本サービスに関する知的財産権は、運営者または正当な権利者に帰属します。
              </Typography>
              <Typography variant="S" className="leading-relaxed">
                2.
                利用者は、運営者の事前の書面による承諾なく、本サービスのコンテンツを複製、転載、改変、販売、出版その他の二次利用をすることはできません。
              </Typography>
              <Typography variant="S" className="leading-relaxed">
                3. 本サービスで利用しているAI技術（Google
                Gemini）に関する権利は、各権利者に帰属します。
              </Typography>
            </div>
          </section>

          {/* Article 6 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              第6条（サービスの変更・終了）
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                1.
                運営者は、利用者に通知することなく、本サービスの内容を変更し、または本サービスの提供を中止することができるものとします。
              </Typography>
              <Typography variant="S" className="leading-relaxed">
                2.
                運営者は、本サービスの提供の停止または中断により、利用者または第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。
              </Typography>
            </div>
          </section>

          {/* Article 7 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              第7条（利用規約の変更）
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                1.
                運営者は、必要と判断した場合には、利用者に通知することなく本規約を変更することができるものとします。
              </Typography>
              <Typography variant="S" className="leading-relaxed">
                2.
                変更後の利用規約は、本サービス上に掲載した時点から効力を生じるものとします。
              </Typography>
            </div>
          </section>

          {/* Article 8 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              第8条（準拠法・管轄裁判所）
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                1. 本規約の解釈にあたっては、日本法を準拠法とします。
              </Typography>
              <Typography variant="S" className="leading-relaxed">
                2.
                本サービスに関して紛争が生じた場合には、運営者の所在地を管轄する裁判所を専属的合意管轄とします。
              </Typography>
            </div>
          </section>

          {/* End */}
          <section>
            <Typography variant="S" color="muted" className="text-right">
              以上
            </Typography>
          </section>
        </article>
      </div>
    </>
  );
}
