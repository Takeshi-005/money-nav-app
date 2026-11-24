---
name: new-page
description: >-
  このプロジェクト(Next.js 16 + FSD)に新しいページを追加するときの正規手順。
  「ページを追加」「◯◯一覧ページを作りたい」「新しい画面」「新規ルート」「LPを作る」など、
  web/src/app 配下に新しいルートが生まれる作業では必ずこのスキルを使う。
  views スキャフォールド・metadata・JSON-LD・navigation/sitemap 登録・README 同期判断まで一気通貫で行う。
  ユーザーが「ページ」と明示しなくても、新規URLが増える実装なら必ず従うこと。
---

# 新規ページ追加スキャフォールド（マネイッポ専用）

新しいページは「views 実装 → app ルート → SEO → 導線登録 → README 同期」の5点セット。
どれか1つでも欠けるとインデックスされない・導線が無い・ドキュメントが乖離する、が起きる。

## 手順

### 1. views レイヤーにページコンポーネントを作る

```
web/src/views/{name}/
├── ui/{Name}Page.tsx   # ページ本体
├── lib/                # ページ固有ロジック（必要時のみ）
└── index.ts            # named export のみ公開
```

```tsx
// index.ts
export { ExamplePage } from "./ui/ExamplePage";
```

実装時の必須規約（詳細は CLAUDE.md 参照）:

- FSD 依存ルール: views → widgets → features → entities → shared の下方向のみ import 可
- テキストは必ず `Typography`（`@/components/ui/Typography`）。生の `<p>/<h1>/<span>` + Tailwind は禁止
- 条件付きクラスは必ず `cn()`（`@/lib/utils`）
- 色は Canonical Classes（`text-foreground` / `text-(--text-secondary)` / `bg-surface-secondary` 等）
- データ取得は React Query（queryOptions + `queryKeys` 一元管理）。初期データは Server Component で取得して渡す

### 2. app ルートを作る（re-export + SEO）

`web/src/app/(main)/{route}/page.tsx` を作成。views の再エクスポートに加えて
**metadata と JSON-LD をこのファイルに置く**（views 側には置かない）。

```tsx
import type { Metadata } from "next";
import { ExamplePage } from "@/views/example";
import { BRAND } from "@/shared/config";

export const revalidate = 3600; // 更新頻度に応じて。ユーザー固有データ表示なら force-dynamic

export const metadata: Metadata = {
  title: "ページタイトル | 補足フレーズ",
  description: "120-160文字。検索意図に答える説明文",
  keywords: ["検索キーワード", "..."],
  openGraph: {
    title: "OGタイトル",
    description: "OG説明文",
    type: "website",
    locale: "ja_JP",
    url: "/example",
    siteName: BRAND.NAME, // ハードコード禁止。必ず BRAND 定数
  },
  twitter: { card: "summary" },
  alternates: { canonical: "/example" },
  robots: { index: true, follow: true }, // 管理画面・実験ページは index: false
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": ["CollectionPage", "LearningResource"], // 下の選択基準参照
  name: "...",
  description: "...",
  educationalLevel: "初心者",
  inLanguage: "ja",
  isAccessibleForFree: true,
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ExamplePage />
    </>
  );
}
```

Schema.org タイプの選択基準: 診断・クイズ→ `Quiz` / 学習コンテンツ→ `LearningResource` /
記事→ `Article` / 一覧→ `CollectionPage`（学習系一覧は配列で併用）。

### 3. navigation.ts に登録する（公開ページのみ）

`web/src/shared/config/navigation.ts` がURL・サイトマップ・ナビの単一情報源。

1. `NAVIGATION_PATHS` にパスを追加（動的詳細ページがあれば `NAVIGATION_BUILDERS` にも）
2. **追加すると `app/sitemap.ts` が型エラーになる**（`STATIC_PAGE_META` / `STATIC_PAGE_LAST_MODIFIED` が
   `Record<StaticPath, ...>` のため）。これは意図された強制なので、sitemap.ts に changeFrequency /
   priority / lastModified を追記して解消する
3. ヘッダー等に導線を出す場合は `PRIMARY_NAV_LINKS` / `SECONDARY_NAV_LINKS` に追加

管理画面（`/admin/*`）やログイン必須ページは navigation 登録・sitemap 掲載ともに不要。
その場合も `robots: { index: false }` を忘れない。

### 4. README 同期を判断する

`web/src/app/(main)/*` への新規ページは CLAUDE.md の同期表により README 更新の検討が**必須**。
「主要機能」セクションとアーキテクチャ図の Web UI 一覧を確認し、更新するか、不要な理由を明示する。

### 5. 検証する

```bash
cd web && pnpm type-check && pnpm lint && pnpm build
```

sitemap の型エラーが残っていれば手順3の漏れ。ビルド後、新ルートが出力に含まれることを確認する。

## 完了時チェックリスト

作業の最後に必ず以下を出力し、状態を明示する:

- [ ] views/{name}（ui + index.ts）作成
- [ ] app ルート作成（metadata + JSON-LD + canonical）
- [ ] navigation.ts / sitemap.ts 登録（非公開ページなら不要の旨と noindex を確認）
- [ ] README 更新（不要なら理由を明示）
- [ ] type-check / lint / build パス
