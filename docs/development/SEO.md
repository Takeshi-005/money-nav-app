# SEO最適化ガイド（実装編）

マネイッポのSEO最適化に関する **実装ガイドライン** をまとめたドキュメントです。

> **ドキュメントの役割分担**
>
> - **実装ガイド（このドキュメント）**: 「どうSEO実装するか」— Metadata、構造化データ、OGP画像など
> - **運用ガイド**: [`SEO_MONITORING.md`](./SEO_MONITORING.md) — 「実装後にどう効果を計測するか」— 計測手順、SQLスニペット、判定フレームワーク

---

## 📋 目次

- [概要](#概要)
- [実装済みページ](#実装済みページ)
- [Metadata実装方法](#metadata実装方法)
- [構造化データ実装](#構造化データ実装)
- [検証方法](#検証方法)
- [ベストプラクティス](#ベストプラクティス)
- [今後の拡張予定](#今後の拡張予定)
- [経過観察（別ドキュメント）](#経過観察)

---

## 概要

### なぜSEO最適化が必要か

1. **検索エンジンでの発見性向上**: 「投資スタイル診断」「投資クイズ」などのキーワードで検索上位を狙う
2. **SNS共有の最適化**: Twitter/Facebook等でリンクシェア時に適切なプレビューを表示
3. **リッチリザルト表示**: 構造化データにより、検索結果に評価スター・所要時間などが表示される可能性
4. **ユーザー体験の向上**: 明確なタイトル・説明文でクリック率（CTR）を向上

### SEO戦略

各ページの検索意図に基づいた最適化：

| ページ | 検索意図 | ターゲットキーワード |
|--------|---------|---------------------|
| 診断 | 情報探索型 + 取引型 | 投資スタイル診断、投資家タイプ診断 |
| クイズ | 教育型 + 習慣型 | 投資クイズ、デイリークイズ |
| 市場解説 | 情報探索型 | 市場解説、日経平均下落 |

---

## 実装済みページ

### ✅ Metadata設定済み（Phase 1完了）

| ページ | ファイルパス | Metadata | 構造化データ |
|--------|-------------|----------|-------------|
| ホーム | `web/src/app/page.tsx` | ✅ | - |
| 診断 | `web/src/app/diagnosis/page.tsx` | ✅ | Quiz Schema |
| クイズ | `web/src/app/quiz/page.tsx` | ✅ | LearningResource Schema |
| 市場解説 | `web/src/app/(main)/market-insights/page.tsx` | ✅ | LearningResource Schema |
| 法的ページ | `terms`, `privacy`, `disclaimer`, `about` | ✅ | - |
| グローバル | `web/src/app/layout.tsx` | ✅ | - |

### ⏳ 未設定（Phase 2以降）

| ページ | ファイルパス | 推奨設定 |
|--------|-------------|---------|
| ダッシュボード | `web/src/app/dashboard/page.tsx` | noindex, nofollow（個人情報保護） |
| クイズ履歴 | `web/src/app/quiz/history/page.tsx` | noindex, nofollow |
| ログイン | `web/src/app/login/page.tsx` | 簡易Metadata + index |

---

## Metadata実装方法

### 基本パターン

Next.js 16のApp Routerでは、ページファイルで`metadata`オブジェクトをエクスポートします。

```typescript
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ページタイトル | サブタイトル",
  description: "ページの説明文（160文字以内推奨）",
  keywords: ["キーワード1", "キーワード2", "キーワード3"],
  openGraph: {
    title: "OGタイトル",
    description: "OG説明文",
    type: "website",
    locale: "ja_JP",
    url: "/page-path",
    siteName: "AI投資パートナー",
  },
  twitter: {
    card: "summary",
    title: "Twitterカードタイトル",
    description: "Twitterカード説明文",
  },
  alternates: {
    canonical: "/page-path",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}
```

### title.templateの活用

Root Layout（`web/src/app/layout.tsx`）で`title.template`を設定済みなので、各ページでは以下のように短く書けます：

```typescript
// Root Layout
export const metadata: Metadata = {
  title: {
    default: "AI投資パートナー | 投資初心者のための学習サービス",
    template: "%s | AI投資パートナー", // テンプレート設定
  },
  // ...
}

// 各ページ
export const metadata: Metadata = {
  title: "AI投資スタイル診断 | あなたは8タイプのどれ？",
  // 自動的に「AI投資スタイル診断 | あなたは8タイプのどれ？ | AI投資パートナー」になる
}
```

### metadataBaseの活用

Root Layoutで`metadataBase`を設定済みなので、OGタグのURLが自動的に絶対パスに変換されます：

```typescript
// Root Layout
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://kabu-news-ai.example.com"),
  // ...
}

// 各ページ
openGraph: {
  url: "/diagnosis", // → https://example.com/diagnosis に自動変換
}
```

---

## 構造化データ実装

### JSON-LD形式での実装

構造化データは、ページコンポーネント内で`<script type="application/ld+json">`として追加します。

#### パターン1: Quiz Schema（診断ページ）

```typescript
export default function Page() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: "AI投資スタイル診断",
    description: "9つの質問に答えるだけで、AIがあなたの投資スタイルを8タイプに分類します。",
    educationalLevel: "初心者",
    teaches: "投資スタイルの自己理解",
    timeRequired: "PT5M", // ISO 8601形式（PT5M = 5分）
    isAccessibleForFree: true,
    inLanguage: "ja",
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <DiagnosisPage />
    </>
  )
}
```

#### パターン2: LearningResource Schema（クイズページ）

```typescript
export default function Page() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: "毎日更新！投資ニュースクイズ",
    description: "時事・基本・シナリオの3問構成で投資判断力を鍛えるデイリークイズ",
    learningResourceType: "Quiz",
    educationalLevel: "初心者〜中級者",
    teaches: "投資判断力、ニュース分析、リスク評価",
    timeRequired: "PT5M",
    isAccessibleForFree: true,
    inLanguage: "ja",
    publisher: {
      "@type": "Organization",
      name: "AI投資パートナー",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <QuizPage />
    </>
  )
}
```

#### パターン3: LearningResource Schema（市場解説ページ）

```typescript
export default function Page() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: "市場解説",
    description: "日経平均下落時にAIが分かりやすく解説。バーゲンセールか底なし沼かの判断材料を提供します。",
    learningResourceType: "Analysis",
    educationalLevel: "初心者",
    teaches: "市場の読み解き方、投資判断",
    isAccessibleForFree: true,
    inLanguage: "ja",
    publisher: {
      "@type": "Organization",
      name: "AI投資パートナー",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketInsightsPage />
    </>
  )
}
```

### 利用可能なSchema.orgタイプ

| タイプ | 用途 | 例 |
|--------|------|-----|
| Quiz | クイズ・診断コンテンツ | 投資スタイル診断 |
| LearningResource | 教育コンテンツ | デイリークイズ、市場解説 |
| Article | 記事コンテンツ | 将来の拡張用 |
| CollectionPage | 記事一覧ページ | 将来の拡張用 |
| FAQPage | よくある質問 | 今後追加予定 |

参考: [Schema.org公式ドキュメント](https://schema.org/)

---

## 検証方法

### ローカル環境での確認

開発サーバーを起動し、ブラウザで確認します：

```bash
pnpm dev
```

ブラウザで対象ページを開き、以下を確認：

1. **右クリック → 「ページのソースを表示」**
2. `<head>`タグ内を確認
3. `<meta property="og:title">`などが正しく出力されているか確認
4. `<script type="application/ld+json">`が存在するか確認

### デプロイ後の検証

#### 1. Google Rich Results Test

**URL**: https://search.google.com/test/rich-results

- 各ページのURLを入力
- 構造化データが正しく認識されているか確認
- エラーや警告がないか確認

**期待される結果**:
- 診断ページ: `Quiz` が検出される
- クイズページ: `LearningResource` が検出される
- 市場解説ページ: `LearningResource` が検出される

#### 2. Twitter Card Validator

**URL**: https://cards-dev.twitter.com/validator

- 各ページのURLを入力
- プレビューが正しく表示されるか確認
- `card: "summary"` の場合、正方形画像が表示される

#### 3. Facebook Sharing Debugger

**URL**: https://developers.facebook.com/tools/debug/

- 各ページのURLを入力
- OG設定が正しく表示されるか確認
- キャッシュをクリア（「再度スクレイピング」ボタン）

#### 4. Google Search Console（登録後）

**URL**: https://search.google.com/search-console

- インデックス状況の確認
- クローラーエラーの確認
- 検索パフォーマンスのモニタリング

---

## ベストプラクティス

### タイトルの書き方

✅ **推奨**:
- 50-60文字以内（モバイル表示を考慮）
- 主要キーワードを前方に配置
- 具体的な数字を含める（「8タイプ」「3問」など）
- ユーザーのベネフィットを明示

❌ **非推奨**:
- 長すぎるタイトル（60文字超）
- キーワードの詰め込み
- 曖昧な表現（「いろいろな」「さまざまな」）

**例**:
```
✅ AI投資スタイル診断 | あなたは8タイプのどれ？
❌ AI投資パートナーの投資スタイル診断ページです。あなたに合った投資方法を診断しましょう。
```

### descriptionの書き方

✅ **推奨**:
- 120-160文字以内
- 行動喚起（CTA）を含める（「今すぐ診断」「5分で完了」）
- 離脱防止要素（「無料」「ログイン不要」）
- ページの内容を正確に要約

❌ **非推奨**:
- キーワードの羅列
- titleと全く同じ内容
- 誇大表現（「必ず儲かる」など）

**例**:
```
✅ 9つの質問に答えるだけで、AIがあなたの投資スタイルを分析。バフェット型、リンチ型など8タイプから最適な投資法を診断します。投資初心者でも5分で完了、完全無料、ログイン不要で今すぐ診断できます。

❌ AI投資パートナーの投資スタイル診断です。診断してみてください。
```

### keywordsの選定

✅ **推奨**:
- 5-10個程度
- プライマリ・セカンダリ・ロングテールを含める
- 検索ボリュームを考慮（Google Keyword Plannerなど）

❌ **非推奨**:
- 20個以上の大量のキーワード
- ページ内容と無関係なキーワード

### コンプライアンス（金融関連）

金融関連コンテンツでは、以下の表現を避けます：

❌ **禁止表現**:
- 「必ず儲かる」「高確率で利益」などの断定表現
- 特定銘柄の推奨（投資助言業違反の可能性）
- 過度な煽り文句（「今すぐ買うべき」など）

✅ **推奨表現**:
- 「参考情報として」「学習目的で」
- 「投資判断はご自身の責任で」
- 「初心者向けの教育コンテンツ」

すべてのMetadataで「参考情報」「学習目的」を明記し、免責事項を強調することが重要です。

---

## 今後の拡張予定

### Phase 2: ユーザー専用ページのnoindex設定

プライバシー保護のため、ユーザー専用ページには検索エンジンのインデックスを許可しません：

```typescript
// web/src/app/dashboard/page.tsx
export const metadata: Metadata = {
  title: "ダッシュボード",
  robots: {
    index: false,
    follow: false,
  },
}
```

対象ページ:
- `/dashboard`: noindex, nofollow（個人情報保護）
- `/quiz/history`: noindex, nofollow

### Phase 3: OG画像の追加

SNS共有時の視認性向上のため、各ページにOG画像を追加：

```typescript
export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: "/og/diagnosis.png",
        width: 1200,
        height: 630,
        alt: "AI投資スタイル診断",
      },
    ],
  },
}
```

**画像仕様**:
- サイズ: 1200×630px（推奨）
- フォーマット: WebP（推奨）、PNG、JPG
- ファイルサイズ: 300KB以下
- 配置場所: `/public/og/`

### Phase 4: サイトマップ生成

検索エンジンのクローリング効率化のため、動的サイトマップを生成：

```typescript
// web/src/app/sitemap.ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://example.com/diagnosis',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // ...
  ]
}
```

### Phase 5: FAQページ追加

ロングテールキーワード獲得のため、よくある質問ページを追加：

```typescript
const structuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "投資スタイル診断は無料ですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "はい、完全無料でご利用いただけます。ログインも不要です。",
      },
    },
    // ...
  ],
}
```

---

## チェックリスト

新しいページにMetadataを追加する際のチェックリスト：

- [ ] `metadata` オブジェクトをエクスポート
- [ ] `title` を50-60文字以内で設定
- [ ] `description` を120-160文字以内で設定
- [ ] `keywords` を5-10個選定
- [ ] `openGraph` 設定（title, description, type, url）
- [ ] `twitter` 設定（card, title, description）
- [ ] `alternates.canonical` を設定
- [ ] `robots` 設定（index, follow）
- [ ] 構造化データ（JSON-LD）を追加（該当する場合）
- [ ] `pnpm type-check` で型エラーがないか確認
- [ ] `pnpm build` でビルドエラーがないか確認
- [ ] ローカル環境で `<head>` タグを確認
- [ ] デプロイ後、Rich Results Testで検証
- [ ] デプロイ後、Twitter Card Validatorで検証

---

## 経過観察

SEO改修の効果を計測する **運用フェーズ** の手順は、別ドキュメント [`SEO_MONITORING.md`](./SEO_MONITORING.md) にまとめています。

主な内容:

- 計測タイミング別の手順（即時 / 短期 / 中期 / 長期）
- 定期運用ルーティン（週次 / 月次 / 四半期）
- Supabase SQLスニペット集（コピペ可能）
- 判定フレームワーク（🟢成功 / 🟡様子見 / 🔴要対処）
- トラブルシューティング

実装が完了したら、必ず [`SEO_MONITORING.md`](./SEO_MONITORING.md) の「デプロイ当日」セクションを参照してください。

---

## 参考資料

### 内部関連ドキュメント

- [SEO経過観察ガイド (`SEO_MONITORING.md`)](./SEO_MONITORING.md) — 運用フェーズの計測手順

### 公式ドキュメント

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Schema.org Documentation](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)

### 検証ツール

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Google Search Console](https://search.google.com/search-console)

### キーワードリサーチ

- [Google Keyword Planner](https://ads.google.com/home/tools/keyword-planner/)
- [Google Trends](https://trends.google.com/)
