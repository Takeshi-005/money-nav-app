# CLAUDE.md

Claude Code 向けのクイックリファレンスです。
無駄なコメントは実装しない方針です

---

## プロジェクト概要

**AI投資パートナー** - 投資初心者向けの学習支援アプリケーション

### 主要機能

- **AI投資スタイル診断**: 9つの質問から8タイプの投資家スタイルを分析
- **投資家ガイド**: 診断タイプ別の詳細学習ガイド（8タイプ × 動的生成）
- **デイリーニュースクイズ**: 毎日3問（時事・心理・歴史・基本・シナリオの5カテゴリ）で投資判断を学習
- **予測トレーニング**: 当日ニュースが翌営業日の好/悪材料となるかを予想（毎日 09:00 JST に Cloud Scheduler で生成）
- **ニュース解説記事**: 投資関連ニュースをAIが初心者向けに解説（日次自動生成は停止済み・既存記事の閲覧のみ継続）
- **適時開示影響分析 / 明日の好悪材料**: `/admin/disclosures` で適時開示情報を扱う公開記事を取り込み、Gemini で銘柄ごとの開示イベントを構造化・重要度スコアリング。`/tomorrow-impact` ページで翌営業日の好材料・悪材料を一覧表示
- **用語集**: 補助学習コンテンツ（新規生成は週次cron）
- **ゲーミフィケーション**: 経験値・レベルで継続学習を促進
- **ゲストユーザー対応**: ログイン不要で診断・クイズを体験可能

---

## 技術スタック

| カテゴリ       | 技術                               |
| -------------- | ---------------------------------- |
| フロントエンド | Next.js 16 (App Router) + React 19 |
| スタイリング   | Tailwind CSS 4                     |
| データベース   | Supabase                           |
| 認証           | Supabase Auth                      |
| AI             | Vertex AI (Gemini 2.5 Flash)       |
| インフラ       | Cloud Run + Cloud Scheduler        |
| IaC            | Terraform                          |
| CI/CD          | GitHub Actions (Workload Identity) |
| アーキテクチャ | Feature-Sliced Design (FSD)        |

---

## 実装方針

### コード品質の原則

本プロジェクトでは **マーティン・ファウラーのリファクタリング原則** に基づいた実装を行います。

#### 必須チェック項目

1. **重複コード（Duplicated Code）の排除**
   - 同じロジックが複数箇所に存在する場合は、関数・コンポーネント・カスタムフックとして抽出
   - 3回以上同じパターンが出現したら抽象化を検討

2. **デッドコードの削除**
   - 使用されていない関数、変数、import文は即座に削除
   - コメントアウトされたコードは残さない（Git履歴で管理）

3. **関数の責務を単一に保つ**
   - 1つの関数は1つの責務のみを持つ（Single Responsibility Principle）
   - 関数が長い場合は意味のある単位で分割

4. **意図が明確な命名**
   - 変数名・関数名は「何をするか」が明確にわかる名前をつける
   - 省略形は避ける（例: `usr` → `user`, `flg` → `isEnabled`）

5. **早期リターンの活用**
   - ネストを深くせず、ガード節で早期リターン
   - if-else の深いネストは避ける

#### リファクタリングのタイミング

- **Red-Green-Refactor**: 機能実装後、必ずリファクタリングフェーズを設ける
- **Boy Scout Rule**: コードを触る際は、元の状態よりも良くして残す
- **実装後の確認**: 実装完了後、必ずビルドエラー・型エラー・Lintエラーがないか確認

### README.md の同期維持

以下のいずれかを変更した場合、`README.md` の更新が必要かを **必ず検討** すること。実装と README が乖離するとプロジェクトの信頼性が損なわれる。

| 変更箇所                                          | README の更新候補                                              |
| ------------------------------------------------- | -------------------------------------------------------------- |
| `web/src/app/(main)/*` に新規ページディレクトリ   | 「主要機能」セクション、アーキテクチャ図の Web UI 一覧         |
| `web/src/app/api/*` に新規エンドポイント          | アーキテクチャ図の API Routes 一覧                             |
| `terraform/cloud-scheduler.tf` に新規/変更ジョブ  | アーキテクチャ図の Cloud Scheduler 一覧                        |
| `web/package.json` の dependencies に新規追加     | 「技術スタック」表                                             |
| `web/package.json` の scripts に新規追加          | 「クイックスタート」セクション                                 |
| 既存機能の **名称変更**（例: クイズ→予測トレーニング）| README 全体で表記を統一                                    |

更新不要と判断した場合は理由を明示し、必要な場合は同じタスク内で README を編集する。

### DBスキーマ・データ変更

DBのスキーマ変更・既存データの正規化など、Supabaseに対する任意の変更は **必ず** `docs/database/migrations/` に SQL ファイルとして残すこと。理由: ローカル/ステージング/本番すべてに同じ修正を再現可能にし、Git で変更履歴を追跡するため。

| ルール | 内容 |
|--------|------|
| 配置先 | `docs/database/migrations/` （既存運用、`web/supabase/migrations/` は使わない） |
| 命名 | `{3桁連番}_{snake_case_description}.sql` (例: `026_normalize_seo_page_url.sql`) |
| 冒頭コメント | `Migration: <name>` / `Description: ...` / `Created: YYYY-MM-DD` の3行ヘッダー必須 |
| 適用方法 | Supabase Dashboard → SQL Editor で手動実行（CLI 未導入） |
| スキーマ変更後 | 必ず `pnpm gen:types` で型を再生成 |

詳細運用は [`docs/database/README.md`](./docs/database/README.md) を参照。

---

## スタイリング方針

### Tailwind CSS 4 Canonical Classes

本プロジェクトでは **Tailwind CSS 4 の Canonical Classes** を採用しています。

#### 基本ルール

1. **エイリアスがある場合**: 短縮形を使用

   ```tsx
   // ✅ 推奨
   className = "text-foreground bg-surface-tertiary";

   // ❌ 非推奨
   className = "text-[var(--text-primary)] bg-[var(--bg-tertiary)]";
   ```

2. **エイリアスがない場合**: `var()` を省略した短縮記法

   ```tsx
   // ✅ 推奨
   className = "text-(--text-secondary) border-(--border-primary)";

   // ❌ 非推奨
   className = "text-[var(--text-secondary)] border-[var(--border-primary)]";
   ```

3. **ブランドカラー**: プレフィックス省略

   ```tsx
   // ✅ 推奨
   className = "text-brand-500 bg-brand-600";

   // ❌ 非推奨
   className = "text-[var(--color-brand-500)] bg-[var(--color-brand-600)]";
   ```

#### 変換表

| 用途           | 従来の記法                                       | Canonical Classes           |
| -------------- | ------------------------------------------------ | --------------------------- |
| 主テキスト     | `text-[var(--text-primary)]`                     | `text-foreground`           |
| 副テキスト     | `text-[var(--text-secondary)]`                   | `text-(--text-secondary)`   |
| 第三テキスト   | `text-[var(--text-tertiary)]`                    | `text-(--text-tertiary)`    |
| 背景（第二）   | `bg-[var(--bg-secondary)]`                       | `bg-surface-secondary`      |
| 背景（第三）   | `bg-[var(--bg-tertiary)]`                        | `bg-surface-tertiary`       |
| 背景（浮遊）   | `bg-[var(--bg-elevated)]`                        | `bg-surface-elevated`       |
| ボーダー       | `border-[var(--border-primary)]`                 | `border-(--border-primary)` |
| シャドウ       | `shadow-[var(--shadow-md)]`                      | `shadow-md`                 |
| ブランド色     | `text-[var(--color-brand-500)]`                  | `text-brand-500`            |
| グラデーション | `style={{ background: 'linear-gradient(...)' }}` | `bg-gradient-brand`         |

#### `style={{}}` を使用する3つの基準

以下の場合のみ `style={{}}` を使用し、それ以外はTailwindクラスで対応：

1. **ユーザー操作で値が変わるもの**: スライダーで動く要素の幅や、マウス位置に追従する要素など。

   ```tsx
   style={{ transform: `translate(${x}px, ${y}px)` }}
   style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
   ```

2. **外部データに依存するもの**: DBから取得した「ユーザーが設定した背景色」を表示する場合。

   ```tsx
   style={{ background: userSettings.bgColor }}
   ```

3. **計算が必要なもの**: 数学的な計算（sin, cos など）を用いて位置を決めるアニメーション。
   ```tsx
   style={{ width: `${(current / total) * 100}%` }}
   ```

#### 条件分岐とクラス名の動的適用

**必ず `cn` ユーティリティを使用してください。**

`cn` は `@/shared/lib/utils` からインポートできるユーティリティ関数で、条件付きクラス名の適用とTailwindクラスの競合解決を行います。

1. **条件分岐**: テンプレートリテラルや三項演算子の代わりに `cn` を使用

   ```tsx
   // ✅ 推奨
   import { cn } from '@/shared/lib/utils'

   <div className={cn(
     "base-class",
     isActive && "active-class",
     isDisabled && "disabled-class"
   )} />

   // ❌ 非推奨
   <div className={`base-class ${isActive ? 'active-class' : ''}`} />
   ```

2. **動的なクラス名**: Props経由で受け取るクラス名も `cn` でマージ

   ```tsx
   // ✅ 推奨
   <div className={cn("w-12 h-12 rounded-xl", iconBgColor)} />

   // ❌ 非推奨
   <div className={`w-12 h-12 rounded-xl ${iconBgColor}`} />
   ```

3. **複雑な条件**: 複数の条件を組み合わせる場合も `cn` が最適
   ```tsx
   // ✅ 推奨
   <button
     className={cn(
       "px-4 py-2 rounded-lg",
       variant === "primary" && "bg-brand-500 text-white",
       variant === "secondary" && "bg-surface-secondary text-foreground",
       disabled && "opacity-50 cursor-not-allowed",
     )}
   />
   ```

#### グラデーション

グラデーションは `globals.css` の `@theme inline` に定義済み。classNameで使用：

```tsx
// ✅ 推奨
<div className="bg-gradient-brand">

// ❌ 非推奨
<div style={{ background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))' }}>
```

**利用可能なグラデーションクラス**:

- `bg-gradient-brand`: ブランドカラー（135°）
- `bg-gradient-brand-deep`: ブランドカラー深め（135°）
- `bg-gradient-accent`: アクセントカラー（135°）
- `bg-gradient-accent-subtle`: アクセントカラー薄め（135°）
- `bg-gradient-positive`: ポジティブカラー（135°）
- `bg-gradient-negative`: ネガティブカラー（135°）
- `bg-gradient-brand-horizontal`: プログレスバー用ブランド（90°）
- `bg-gradient-brand-accent`: プログレスバー用ブランド→アクセント（90°）
- `bg-gradient-accent-horizontal`: プログレスバー用アクセント（90°）
- `bg-gradient-positive-horizontal`: プログレスバー用ポジティブ（90°）

完全なリストは `web/src/app/globals.css` の `@theme inline` セクションを参照。

### CVAコンポーネント設計

本プロジェクトでは、CVA（Class Variance Authority）を使用して汎用UIコンポーネントを設計します。

#### CVAとは

CVAは、バリアント駆動のコンポーネント設計を可能にするライブラリです。型安全にスタイルのバリエーションを管理できます。

#### 基本的な実装パターン

1. **バリアント定義**

   ```tsx
   import { cva, type VariantProps } from "class-variance-authority";

   export const buttonVariants = cva(
     "inline-flex items-center justify-center rounded-lg font-medium transition", // 基本クラス
     {
       variants: {
         variant: {
           primary: "bg-brand-500 text-white hover:bg-brand-600",
           secondary:
             "bg-surface-secondary text-foreground hover:bg-surface-tertiary",
         },
         size: {
           sm: "px-3 py-1.5 text-sm",
           md: "px-4 py-2 text-base",
           lg: "px-6 py-3 text-lg",
         },
       },
       defaultVariants: {
         variant: "primary",
         size: "md",
       },
     },
   );
   ```

2. **Props型定義**

   ```tsx
   interface ButtonProps
     extends
       React.ButtonHTMLAttributes<HTMLButtonElement>,
       VariantProps<typeof buttonVariants> {
     children: React.ReactNode;
     className?: string;
   }
   ```

3. **コンポーネント実装**

   ```tsx
   import { cn } from "@/shared/lib/utils";

   export function Button({
     variant,
     size,
     className,
     children,
     ...props
   }: ButtonProps) {
     return (
       <button
         className={cn(buttonVariants({ variant, size }), className)}
         {...props}
       >
         {children}
       </button>
     );
   }
   ```

4. **Public API定義**
   ```tsx
   // index.ts
   export { Button, buttonVariants } from "./Button";
   export type { ButtonProps } from "./Button";
   ```

#### バリアント値の決定方法

1. **Tailwindクラスを直接使用**
   - ✅ 推奨: `bg-brand-100`, `text-positive-600`, `rounded-xl`
   - ❌ 非推奨: カスタムCSS変数、インラインスタイル

2. **意味のある名前を付ける**
   - ✅ 推奨: `variant: "primary" | "secondary"`, `size: "sm" | "md" | "lg"`
   - ❌ 非推奨: `variant: "v1" | "v2"`, `size: "small" | "medium"`

3. **デフォルト値を設定**
   ```tsx
   defaultVariants: {
     variant: "primary",
     size: "md",
   }
   ```

#### バリアント命名規則

| 用途         | バリアント名   | 値の例                              |
| ------------ | -------------- | ----------------------------------- |
| 見た目・意図 | `variant`      | primary, secondary, danger, ghost   |
| サイズ       | `size`         | sm, md, lg, xl                      |
| 角の丸み     | `rounded`      | sm, md, lg                          |
| 色           | `color`        | brand, accent, positive, negative   |
| 状態         | 個別プロパティ | `disabled`, `isLoading`, `isActive` |

#### cn()ユーティリティの活用

CVAのバリアントと追加のclassNameを統合するため、必ず `cn()` を使用します。

```tsx
// ✅ 推奨
<Button variant="primary" size="lg" className="shadow-lg mx-auto">

// cn() の内部動作
className={cn(buttonVariants({ variant, size }), className)}
// → "inline-flex items-center ... bg-brand-500 text-white ... px-6 py-3 text-lg shadow-lg mx-auto"
```

#### 実装時のチェックリスト

- [ ] CVAでバリアント定義を実装
- [ ] VariantPropsで型を定義
- [ ] HTMLAttributesを継承して拡張性を確保
- [ ] cn()でclassNameをマージ
- [ ] index.tsで公開API（コンポーネント + バリアント）をエクスポート
- [ ] デフォルトバリアントを設定

#### 既存コンポーネントへの適用例

**Before（手動実装）**:

```tsx
<div
  className={`
    w-10 h-10 rounded-xl flex items-center justify-center
    ${bgColor === "accent" ? "bg-accent-100" : "bg-brand-100"}
    ${size === "lg" ? "w-12 h-12" : "w-10 h-10"}
  `}
>
  <Icon />
</div>
```

**After（CVA使用）**:

```tsx
import { IconContainer } from "@/shared/ui/icon-container";

<IconContainer size="md" rounded="md" bgColor="accent">
  <Icon />
</IconContainer>;
```

詳細: [UIコンポーネントAPIリファレンス](./docs/reference/UI_COMPONENTS.md)

### Typographyコンポーネント

テキストの実装は必ず `Typography` コンポーネントを使用すること。直接のHTMLテキスト要素（`<p>`, `<h1>`〜`<h6>`, `<span>`）にTailwindクラスを直接付与してスタイリングすることは禁止。

**インポート**:
```tsx
import { Typography } from "@/shared/ui/typography";
```

**バリアント一覧（variantプロパティ）**:
| バリアント | サイズ     | 用途                          |
|------------|------------|-------------------------------|
| title_L    | 32px bold  | メインタイトル（自動: h1）    |
| title_M    | 28px bold  | セクションタイトル（自動: h2）|
| title_S    | 24px bold  | サブタイトル（自動: h3）      |
| title_SS   | 20px bold  | 小タイトル・SP用（自動: h4）  |
| L_bold     | 18px bold  | 強調テキスト                  |
| L          | 18px       | 本文大                        |
| M_bold     | 16px bold  | 標準強調（自動: p）           |
| M          | 16px       | 本文標準・デフォルト          |
| S_bold     | 14px bold  | 小テキスト強調                |
| S          | 14px       | 小テキスト                    |
| caution    | 12px       | 注釈・補足・パンくず          |
| price      | 24px bold  | 価格表示                      |

**使用例**:
```tsx
// ❌ 非推奨
<p className="text-sm font-bold text-brand-600">📚 用語解説</p>
<h2 className="text-lg font-bold">タイトル</h2>

// ✅ 推奨
<Typography variant="S_bold" className="text-brand-600">📚 用語解説</Typography>
<Typography variant="L_bold" as="h2">タイトル</Typography>

// as propで要素を明示的に指定（title_*以外でセマンティックHTML要素を使う場合）
<Typography variant="S" as="span" className="text-(--text-secondary)">補足テキスト</Typography>
```

---

## フロントエンドアーキテクチャ

本プロジェクトは **Feature-Sliced Design (FSD)** を採用しています。

> 詳細: [docs/architecture/FRONTEND_ARCHITECTURE.md](./docs/architecture/FRONTEND_ARCHITECTURE.md)

### レイヤー構成（上から下への依存のみ許可）

| レイヤー   | 責務                                           |
| ---------- | ---------------------------------------------- |
| `app`      | プロバイダー、グローバル設定                   |
| `views`    | ページコンポーネント（FSD pages レイヤー相当） |
| `widgets`  | 大規模な独立UI                                 |
| `features` | ビジネス機能                                   |
| `entities` | ビジネスエンティティ                           |
| `shared`   | 共通ユーティリティ、UI                         |

### 依存関係ルール

```
app → views → widgets → features → entities → shared
```

- **上位レイヤー → 下位レイヤー** のみインポート可能
- 同一レイヤー内のスライス間での相互依存は **禁止**

---

## ディレクトリ構成

```
kabu-news-ai/
├── web/                        # Next.js アプリケーション
│   ├── src/
│   │   ├── app/               # ページ・APIルート
│   │   │   ├── api/           # REST API エンドポイント
│   │   │   ├── auth/          # 認証コールバック
│   │   │   ├── diagnosis/     # 投資スタイル診断（app 直下）
│   │   │   ├── quiz/          # デイリークイズ（app 直下）
│   │   │   ├── (main)/        # メインのページグループ（共通レイアウト適用）
│   │   │   │   ├── dashboard/         # 学習ダッシュボード
│   │   │   │   ├── investor-guides/   # 投資家ガイド
│   │   │   │   ├── news-articles/     # ニュース解説記事
│   │   │   │   ├── tomorrow-impact/   # 明日の好悪材料（適時開示）
│   │   │   │   ├── glossary/          # 用語集
│   │   │   │   └── admin/             # 社内向け管理画面（disclosures / seo-audit / watched-stocks 他）
│   │   │   └── (legal)/       # 法的ページ（terms / privacy / about 他）
│   │   ├── views/             # ページコンポーネント（FSD pages 相当）
│   │   ├── widgets/           # 大規模UI
│   │   ├── features/          # ビジネス機能
│   │   ├── entities/          # ビジネスエンティティ
│   │   └── shared/            # 共通ユーティリティ・UI（Typography・shared/api 等）※新規共通コードはここへ
│   └── Dockerfile
│
├── docker/                     # Docker設定（ローカル開発用）
│   └── docker-compose.yml     # n8n開発環境
│
├── terraform/                  # インフラ定義
│   ├── cloud-run.tf           # Cloud Run設定
│   ├── cloud-scheduler.tf     # バッチスケジュール
│   └── workload-identity.tf   # GitHub Actions認証
│
├── .github/workflows/          # CI/CD
│   └── deploy.yml             # 自動デプロイ
│
└── docs/                       # ドキュメント
    └── README.md              # ドキュメント目次
```

### `src/lib` 撤廃済み（#60 完了）

かつて FSD レイヤーの外に存在したレガシー共通層 `src/lib` は、#60 で FSD 構造へ全面統合し **撤廃済み**。`@/lib` import は ESLint（`no-restricted-imports`）で全面禁止している。移行先は以下の通り。

| 旧 `src/lib` | 現在の置き場 |
|--------------|--------------|
| `date` / `utils`（`cn`）/ `logger` / `guest-storage` | `@/shared/lib/*` |
| `supabase` / `gemini` / `seo` / `slack` / `news-api` / `x-post` / `market-data` / `search-engines` / `google-apis` / `disclosure-import` | `@/shared/api/*` |
| `supabase/glossary-client` | `@/entities/glossary-term/api/*` |
| `diagnosis/investor-type-data` | `@/entities/diagnosis/model/*` |
| `auth-context` | `@/entities/session`（認証セッションの現在状態） |

新規共通コードはクライアント寄りなら `@/shared/lib`、外部 API/バックエンド連携なら `@/shared/api`、特定エンティティに属するなら `@/entities/*` へ置く。

---

## 開発コマンド

```bash
# 開発サーバー起動
cd web && pnpm dev

# ビルド確認
cd web && pnpm build

# 型チェック
cd web && pnpm type-check

# ユニットテスト実行
cd web && pnpm test

# テストカバレッジ確認（対象ファイル数は `pnpm test:coverage` 出力で都度確認）
cd web && pnpm test:coverage

# インフラ確認
cd terraform && terraform plan
```

---

## 重要な実装パターン

### データ取得パターン（React Query）

本プロジェクトでは `@tanstack/react-query` を使用したデータ取得を採用しています。

#### 1. QueryClientProvider設定（app/layout.tsx）

アプリケーション全体をQueryClientProviderでラップし、React Queryを有効化：

```typescript
import { QueryClientProvider } from "@/shared/api/query-client"

export default async function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <QueryClientProvider>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

#### 2. Client Componentでのデータ取得

カスタムフックとqueryOptionsを使用してデータを取得：

```typescript
// features/dashboard-data/model/useDashboardData.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboardQueryOptions } from "./queryOptions";

export function useDashboardData() {
  const { data, isLoading, error, refetch } = useQuery(dashboardQueryOptions);
  return { data, isLoading, error, refetch };
}

// queryOptions の定義
import { queryOptions } from "@tanstack/react-query";
import { fetchDashboardData } from "../api/fetchDashboardData";
import { queryKeys } from "@/shared/api/query-client";

export const dashboardQueryOptions = queryOptions({
  queryKey: queryKeys.dashboard.data(),
  queryFn: fetchDashboardData,
  staleTime: 2 * 60 * 1000, // 2分
});
```

#### 3. Server Componentでの初期データ取得

Server Componentで初期データを取得し、Client Componentに渡すパターン：

```typescript
// views/news-articles/ui/NewsArticlesPage.tsx
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

async function getLatestArticle() {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from("news_articles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(1)
    .single()
  return data
}

export async function NewsArticlesPage() {
  const article = await getLatestArticle()
  // Client Componentに初期データを渡す
  return <NewsArticlesPageClient initialArticle={article} />
}
```

#### 4. QueryKeys の一元管理

キャッシュ管理のベストプラクティスとして、QueryKeyを一元管理：

```typescript
// shared/api/query-client/queryKeys.ts
export const queryKeys = {
  dashboard: {
    all: ["dashboard"] as const,
    data: () => [...queryKeys.dashboard.all, "data"] as const,
  },
  newsArticle: {
    all: ["news-article"] as const,
    byDate: (date?: string) =>
      date
        ? ([...queryKeys.newsArticle.all, "date", date] as const)
        : ([...queryKeys.newsArticle.all, "latest"] as const),
    dates: () => [...queryKeys.newsArticle.all, "dates"] as const,
  },
  disclosureImpact: {
    all: ["disclosure-impact"] as const,
    byDate: (date: string) =>
      [...queryKeys.disclosureImpact.all, "date", date] as const,
  },
} as const;
```

### API Route での認証

```typescript
// app/api/quiz/route.ts
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // 認証済み処理...
}
```

### SEOとMetadata

Next.js 16のApp Routerでは、各ページで`metadata`オブジェクトをエクスポートしてSEO最適化を行います。

#### 基本パターン

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ページタイトル",
  description: "ページの説明文（120-160文字以内推奨）",
  keywords: ["キーワード1", "キーワード2"],
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
  },
  alternates: {
    canonical: "/page-path",
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

#### 構造化データ（JSON-LD）

検索結果でリッチリザルトを表示するため、構造化データを追加：

```typescript
export default function Page() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Quiz", // または LearningResource, Article, CollectionPage
    name: "AI投資スタイル診断",
    description: "診断の説明",
    educationalLevel: "初心者",
    timeRequired: "PT5M", // ISO 8601形式（5分）
    isAccessibleForFree: true,
    inLanguage: "ja",
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <YourPageComponent />
    </>
  )
}
```

#### Root Layoutの設定

`app/layout.tsx`で`metadataBase`と`title.template`を設定済み：

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://example.com",
  ),
  title: {
    default: "AI投資パートナー | 投資初心者のための学習サービス",
    template: "%s | AI投資パートナー", // 各ページで自動付与
  },
  // ...
};
```

**利用可能なSchema.orgタイプ**:

- `Quiz`: 診断・クイズコンテンツ
- `LearningResource`: 教育コンテンツ
- `Article`: 記事コンテンツ
- `CollectionPage`: 記事一覧ページ

> 詳細: [docs/development/SEO.md](./docs/development/SEO.md)

---

## 環境変数

| 変数名                          | 用途                                     |
| ------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | アプリケーションのベースURL（SEO/OGP用） |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase プロジェクトURL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開キー                        |
| `SUPABASE_SERVICE_ROLE_KEY`     | サーバー用シークレットキー               |
| `GCP_PROJECT_ID`                | Vertex AI プロジェクトID（ADC認証で使用）|
| `GOOGLE_CLOUD_LOCATION`         | Vertex AI リージョン（例: asia-northeast1）|
| `CRON_SECRET`                   | 開発用 `/api/test/*` の認証（本番 cron は OIDC 認証のため不要） |
| `SLACK_WEBHOOK_URL`             | Slack 通知用 Webhook（AI Observability・用語集生成・X 下書き等で使用） |
| `INDEXNOW_API_KEY`              | IndexNow（検索エンジン即時通知）用APIキー |
| `GA4_PROPERTY_ID`               | Google Analytics 4 プロパティID（SEO計測）|
| `SEARCH_CONSOLE_SITE_URL`       | Search Console 対象サイトURL（SEO計測）  |

詳細: [docs/setup/SECRETS.md](./docs/setup/SECRETS.md)

---

## よくある操作

### 新しいページを追加

1. `web/src/views/{name}/ui/{Name}Page.tsx` にページコンポーネントを作成
2. `web/src/views/{name}/index.ts` でエクスポート
3. `web/src/app/(main)/{route}/page.tsx` から views のコンポーネントを re-export
4. **SEO最適化**: `app/` 側の page.tsx に `metadata` オブジェクトを追加（詳細: [SEOガイド](./docs/development/SEO.md)）

### 新しいAPIを追加

1. `web/src/app/api/{endpoint}/route.ts` を作成
2. GET/POST などのメソッドをエクスポート
3. 認証が必要なら `createClient()` で検証

### インフラ変更

1. `terraform/*.tf` を編集
2. `terraform plan` で確認
3. `terraform apply` で適用

---

## 詳細ドキュメント

すべてのドキュメントは `docs/` 配下に整理されています。

**→ [docs/README.md](./docs/README.md)** で目次を確認してください。

| カテゴリ                               | 内容                                                  |
| -------------------------------------- | ----------------------------------------------------- |
| [アーキテクチャ](./docs/architecture/) | システム構成、データベース設計、**FSDアーキテクチャ** |
| [セットアップ](./docs/setup/)          | ローカル環境、GCP、環境変数                           |
| [開発ガイド](./docs/development/)      | Next.js、Terraform                                    |
| [デプロイ](./docs/deployment/)         | GitHub Actions CI/CD                                  |
| [リファレンス](./docs/reference/)      | API仕様、トラブルシューティング                       |
