import type { Metadata } from "next";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Typography } from "@/shared/ui/typography";
import { BRAND } from "@/shared/config";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: `${BRAND.NAME}における個人情報の取り扱いについて。収集する情報（アカウント情報・利用履歴）、利用目的、第三者提供、外部サービス（Supabase、Google Gemini API）、Cookie、セキュリティ対策について詳しく説明しています。`,
};

export default function PrivacyPage() {
  const breadcrumbItems = [
    { label: "ホーム", href: "/" },
    { label: "プライバシーポリシー" },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} className="max-w-3xl mx-auto px-4" />
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6">
        {/* Title Section */}
        <div className="mb-10">
          <Typography variant="title_S" as="h1" className="sm:text-3xl mb-3 text-foreground">
            プライバシーポリシー
          </Typography>
          <Typography variant="S">最終更新日: 2026年7月9日</Typography>
        </div>

        {/* Content Area */}
        <article className="prose prose-lg max-w-none text-(--text-secondary)">
          {/* Introduction */}
          <section className="mb-10">
            <Typography variant="S" className="leading-relaxed">
              {BRAND.NAME}（以下「本サービス」といいます）は、利用者の個人情報の保護を重要な責務と認識し、
              以下のとおりプライバシーポリシーを定め、個人情報の適切な取り扱いに努めます。
            </Typography>
          </section>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              1. 収集する情報について
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                本サービスでは、以下の情報を収集する場合があります。
              </Typography>

              <div className="rounded-lg p-4 bg-surface-tertiary border border-(--border-primary)">
                <h3 className="font-semibold text-sm mb-3 text-foreground">
                  アカウント情報（Googleログイン利用時）
                </h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>メールアドレス</li>
                  <li>表示名（ニックネーム）</li>
                  <li>プロフィール画像URL</li>
                </ul>
              </div>

              <div className="rounded-lg p-4 bg-surface-tertiary border border-(--border-primary)">
                <h3 className="font-semibold text-sm mb-3 text-foreground">
                  利用情報
                </h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>診断結果・クイズ回答履歴</li>
                  <li>サービス利用日時・アクセスログ</li>
                  <li>ブラウザ情報・デバイス情報</li>
                </ul>
              </div>

              <Typography variant="S" className="leading-relaxed">
                ※ゲストユーザーとしてご利用の場合、個人を特定する情報は収集されません。
              </Typography>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              2. 利用目的
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                収集した情報は、以下の目的で利用します。
              </Typography>

              <ul className="text-sm space-y-2 list-disc list-inside pl-4">
                <li>本サービスの提供・運営</li>
                <li>ユーザー認証・アカウント管理</li>
                <li>診断結果・クイズ履歴の保存</li>
                <li>サービスの改善・新機能の開発</li>
                <li>利用状況の分析（統計データの作成）</li>
                <li>重要なお知らせの通知</li>
                <li>お問い合わせへの対応</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              3. 第三者への提供
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                本サービスは、以下の場合を除き、利用者の個人情報を第三者に提供することはありません。
              </Typography>

              <ul className="text-sm space-y-2 list-disc list-inside pl-4">
                <li>利用者の同意がある場合</li>
                <li>法令に基づく開示請求があった場合</li>
                <li>人の生命、身体または財産の保護のために必要な場合</li>
                <li>
                  サービス運営上必要な委託先への提供（秘密保持義務を課した上で）
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              4. 外部サービスの利用
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                本サービスでは、以下の外部サービスを利用しています。
                各サービスにおける情報の取り扱いについては、各サービスのプライバシーポリシーをご確認ください。
              </Typography>

              <div className="rounded-lg p-4 bg-surface-tertiary border border-(--border-primary)">
                <ul className="text-sm space-y-3">
                  <li>
                    <span className="font-semibold text-foreground">
                      Supabase
                    </span>
                    <span className="text-(--text-secondary)">
                      （認証・データベース）
                    </span>
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">
                      Google Gemini API
                    </span>
                    <span className="text-(--text-secondary)">
                      （AI分析・コンテンツ生成）
                    </span>
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">
                      Google Cloud Platform
                    </span>
                    <span className="text-(--text-secondary)">
                      （サーバーインフラ）
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              5. Cookieの使用
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                本サービスでは、ユーザー体験の向上のためにCookieを使用しています。
              </Typography>

              <ul className="text-sm space-y-2 list-disc list-inside pl-4">
                <li>セッション管理（ログイン状態の維持）</li>
                <li>テーマ設定（ライト/ダークモード）の保存</li>
                <li>利用状況の分析</li>
              </ul>

              <Typography variant="S" className="leading-relaxed">
                Cookieはブラウザの設定により無効化することができますが、
                一部の機能が正常に動作しなくなる可能性があります。
              </Typography>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              6. セキュリティ
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                本サービスは、個人情報の漏洩、紛失、改ざんを防止するため、
                以下のセキュリティ対策を実施しています。
              </Typography>

              <ul className="text-sm space-y-2 list-disc list-inside pl-4">
                <li>SSL/TLSによる通信の暗号化</li>
                <li>アクセス権限の適切な管理</li>
                <li>定期的なセキュリティアップデート</li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              7. データの保持期間
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                収集した個人情報は、利用目的の達成に必要な期間保持します。
                アカウントを削除された場合、関連する個人情報は合理的な期間内に削除されます。
              </Typography>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              8. プライバシーポリシーの変更
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                本プライバシーポリシーは、必要に応じて変更されることがあります。
                重要な変更がある場合は、本サービス上でお知らせします。
                変更後のプライバシーポリシーは、本ページに掲載した時点から効力を生じます。
              </Typography>
            </div>
          </section>

          {/* Section 9 */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              9. 広告配信について
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                本サービスは、第三者が提供するアフィリエイトプログラムおよび広告配信サービスを利用しており、
                これらを通じて広告収益を得る場合があります。
              </Typography>

              <Typography variant="S" className="leading-relaxed">
                アフィリエイトプログラムや広告配信事業者は、ユーザーの興味に応じた広告を表示するため、
                Cookie等を利用して当サイトや他サイトへのアクセス情報（氏名・住所・メールアドレス等の個人を特定する情報は含みません）を
                収集する場合があります。収集される情報の取り扱いは各事業者のプライバシーポリシーに従います。
              </Typography>

              <Typography variant="S" className="leading-relaxed">
                広告配信に用いられるCookieは、ブラウザの設定により無効化することができます。
              </Typography>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-bold mb-4 pb-2 border-b text-foreground border-(--border-primary)">
              10. お問い合わせ
            </h2>

            <div className="space-y-4">
              <Typography variant="S" className="leading-relaxed">
                個人情報の取り扱いに関するお問い合わせは、
                <a href="/about" className="underline text-brand-500">
                  運営者情報ページ
                </a>
                に記載の連絡先までお願いいたします。
              </Typography>
            </div>
          </section>
        </article>
      </div>
    </>
  );
}
