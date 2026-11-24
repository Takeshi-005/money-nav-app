# GitHub Copilot Instructions

このプロジェクトは、AI 投資パートナー（株式ニュース学習アプリ）のための Next.js アプリケーションです。

## プロジェクト概要

- **目的**: 投資初心者向けの金融リテラシー向上支援
- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript (strict mode)
- **アーキテクチャ**: Feature-Sliced Design (FSD)
- **スタイリング**: Tailwind CSS v4
- **認証**: Supabase Auth
- **データベース**: Supabase (PostgreSQL)
- **AI**: Google Gemini API
- **状態管理**: TanStack Query (React Query)

---

## アーキテクチャ原則

### Feature-Sliced Design (FSD)

プロジェクトは FSD アーキテクチャに従います。レイヤーは以下の順序で構成されます:

```
app → pages → widgets → features → entities → shared
```

#### レイヤー別責務

1. **app** (`src/app/`): Next.js App Router、グローバル設定、プロバイダー、レイアウト
2. **pages**: ページコンポジション（Next.js の App Router では `app/` 配下の page.tsx で実装）
3. **widgets** (`src/widgets/`): 大規模で独立した複合 UI コンポーネント（ヘッダー、フッター、カードなど）
4. **features** (`src/features/`): ユーザー価値を提供する再利用可能な機能単位
5. **entities** (`src/entities/`): ビジネスエンティティ（user、quiz、diagnosis など）
6. **shared** (`src/shared/`): 汎用的な再利用可能コンポーネントとユーティリティ

#### 依存関係ルール

- **上位 → 下位のみ**: 上位レイヤーは下位レイヤーのみをインポート可能
- **同一レイヤー内の相互依存禁止**: 例: `features/A` → `features/B` は不可
- **Public API 経由**: 各スライスは `index.ts` で Public API をエクスポート

#### セグメント構成

各スライス内は以下のセグメントで構成:

- **ui/**: UI コンポーネント
- **model/**: ビジネスロジック、型定義、カスタムフック
- **api/**: API 通信ロジック (TanStack Query 使用)
- **lib/**: ユーティリティ関数
- **config/**: 設定、定数

---

## コーディング規約

### TypeScript

- **strict mode**: すべての型チェックを有効化
- **明示的な型定義**: 関数の引数と戻り値には型を明示
- **`any` 禁止**: `unknown` または適切な型を使用
- **型ガード**: `unknown` 型の値は型ガードで検証後に使用
- **Zod バリデーション**: 外部入力（API、フォーム）は Zod スキーマで検証

```typescript
// ✅ Good
export function calculateScore(answers: Answer[]): number {
  return answers.reduce((sum, a) => sum + a.points, 0);
}

// ❌ Bad
export function calculateScore(answers) {
  return answers.reduce((sum, a) => sum + a.points, 0);
}
```

### React / Next.js

- **Server Components 優先**: デフォルトは Server Components、必要時のみ `'use client'`
- **非同期コンポーネント**: データフェッチは Server Components 内で直接実行
- **Client Components**: インタラクティブ UI、イベントハンドラー、ブラウザ API 使用時のみ
- **命名規則**:
  - コンポーネント: PascalCase (`UserProfile.tsx`)
  - フック: `use` プレフィックス (`useQuizState.ts`)
  - ユーティリティ: camelCase (`formatDate.ts`)

```typescript
// ✅ Server Component
async function QuizList() {
  const quizzes = await fetchQuizzes();
  return <div>{/* ... */}</div>;
}

// ✅ Client Component
("use client");
function QuizAnswerButton({ onSubmit }: Props) {
  const handleClick = () => onSubmit();
  return <button onClick={handleClick}>Submit</button>;
}
```

### データフェッチング

- **Server Components**: 直接データベース/API クエリ
- **Client Components**: TanStack Query (`useQuery`, `useMutation`)
- **Route Handlers**: `/api` エンドポイントとして実装
- **エラーハンドリング**: 必ず `try-catch` でエラーを捕捉し、適切なレスポンスを返す

```typescript
// ✅ Server Component
import { createClient } from "@/lib/supabase/server";

async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("quizzes").select("*");
  return <Dashboard quizzes={data} />;
}

// ✅ Client Component
("use client");
import { useQuery } from "@tanstack/react-query";

function UserStats() {
  const { data } = useQuery({
    queryKey: ["user-stats"],
    queryFn: fetchUserStats,
  });
  return <StatsChart data={data} />;
}
```

### スタイリング

- **Tailwind CSS**: ユーティリティファーストアプローチ
- **cn()ヘルパー**: `clsx` + `tailwind-merge` で条件付きクラス
- **レスポンシブ**: モバイルファーストで記述 (`sm:`, `md:`, `lg:`)
- **カラーパレット**: `tailwind.config` で定義された変数を使用
- **dark mode**: `dark:` プレフィックスで対応

```typescript
import { cn } from "@/lib/utils";

function Button({ variant, className }: Props) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-colors",
        variant === "primary" && "bg-primary text-white hover:bg-primary/90",
        variant === "secondary" && "bg-secondary text-gray-900",
        className
      )}
    >
      {children}
    </button>
  );
}
```

### ファイル構成

```
src/
├── app/                    # Next.js App Router
│   ├── (main)/            # ルートグループ（認証済み）
│   ├── (legal)/           # 法的ページグループ
│   ├── api/               # API Routes
│   ├── auth/              # 認証ページ
│   └── layout.tsx         # ルートレイアウト
├── components/            # レガシー（段階的にwidgets/features/に移行）
├── entities/              # ビジネスエンティティ
│   ├── user/
│   ├── quiz/
│   ├── diagnosis/
│   └── stock-analysis/
├── features/              # 機能単位のスライス
│   ├── submit-quiz-answer/
│   ├── start-diagnosis/
│   └── sync-guest-data/
├── widgets/               # 複合UIコンポーネント
│   ├── site-header/
│   ├── site-footer/
│   └── quiz-card/
├── shared/                # 共通ユーティリティ
│   ├── ui/               # 汎用UIコンポーネント（Button、Input等）
│   ├── lib/              # ユーティリティ関数
│   ├── config/           # 設定定数
│   └── types/            # 共通型定義
├── lib/                   # ライブラリ初期化
│   ├── supabase/         # Supabaseクライアント
│   ├── gemini.ts         # Gemini API
│   └── utils.ts          # cn()等
├── types/                 # 型定義
│   └── database.types.ts # Supabase生成型
└── middleware.ts          # 認証ミドルウェア
```

---

## 新機能実装ガイド

### 1. エンティティの追加

新しいビジネスエンティティが必要な場合:

```
src/entities/[entity-name]/
├── model/
│   ├── types.ts          # 型定義
│   └── schema.ts         # Zodスキーマ
├── api/
│   └── queries.ts        # データ取得関数
├── lib/
│   └── helpers.ts        # ユーティリティ
└── index.ts              # Public API
```

### 2. 機能の追加

ユーザー操作が必要な機能:

```
src/features/[feature-name]/
├── ui/
│   └── FeatureName.tsx   # UIコンポーネント
├── model/
│   ├── types.ts
│   └── useFeature.ts     # カスタムフック
├── api/
│   └── mutation.ts       # useMutation
└── index.ts
```

### 3. Widget の追加

複数の機能を統合した大規模 UI:

```
src/widgets/[widget-name]/
├── ui/
│   └── WidgetName.tsx
├── model/
│   └── useWidget.ts
└── index.ts
```

### 4. API Route の追加

```typescript
// app/api/[endpoint]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ビジネスロジック

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
```

---

## テスト

- **フレームワーク**: Vitest + React Testing Library
- **カバレッジ**: 重要な機能は 80%以上を目標
- **テスト配置**: `__tests__/` または `*.test.ts` 隣接配置

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("QuizCard", () => {
  it("should render quiz question", () => {
    render(<QuizCard question="Sample question?" />);
    expect(screen.getByText("Sample question?")).toBeInTheDocument();
  });
});
```

---

## 環境変数

必要な環境変数は `.env`:

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vertex AI（gcloud auth application-default login で認証）
GCP_PROJECT_ID=
GOOGLE_CLOUD_LOCATION=asia-northeast1

# Cron Secret（任意: /api/test/ のローカルテスト用）
CRON_SECRET=
```

---

## パフォーマンス最適化

- **画像最適化**: `next/image` を使用
- **動的インポート**: 重いコンポーネントは `next/dynamic`
- **メモ化**: 高コストな計算は `useMemo`、コールバックは `useCallback`
- **React Query**: キャッシュ戦略を適切に設定（`staleTime`, `cacheTime`）

---

## アクセシビリティ

- **セマンティック HTML**: `<button>`, `<nav>`, `<main>` 等を適切に使用
- **ARIA 属性**: 必要に応じて `aria-label`, `aria-describedby` を追加
- **キーボード操作**: フォーカス管理、Enter/Space キー対応
- **コントラスト比**: WCAG AA 基準（4.5:1 以上）

---

## セキュリティ

- **認証**: Supabase Row Level Security (RLS) を使用
- **環境変数**: クライアント公開する場合は `NEXT_PUBLIC_` プレフィックス
- **XSS 対策**: ユーザー入力は必ずエスケープ
- **CSRF 対策**: API Route でトークン検証（Cron 等）

---

## コミット規約

Conventional Commits 形式:

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント変更
style: コードフォーマット
refactor: リファクタリング
test: テスト追加・修正
chore: ビルドプロセス・補助ツール変更
```

例:

```
feat(quiz): デイリークイズのタイマー機能を追加
fix(auth): ログアウト後のリダイレクト不具合を修正
docs: README にデプロイ手順を追加
```

---

## 参考ドキュメント

- [Next.js App Router](https://nextjs.org/docs/app)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## AI アシスト時の注意事項

- 既存の FSD アーキテクチャを尊重し、適切なレイヤーに配置する
- Server Components と Client Components を適切に使い分ける
- 型安全性を最優先し、`any`を使わない
- 新しいコンポーネントは必ず Public API (`index.ts`) でエクスポート
- エラーハンドリングを忘れずに実装する
- ユーザー体験を考慮したレスポンシブデザインを心がける
