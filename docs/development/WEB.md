# Next.js 開発ガイド

Next.js App Router を使用したWebアプリケーション開発のガイドです。

---

## 💡 このガイドから学べること

- **App Router** のディレクトリ構造
- **Server Components** と **Client Components** の使い分け
- **API Route (Route Handlers)** の実装パターン
- **コンポーネント設計** のベストプラクティス

---

## ディレクトリ構造

```
web/src/
├── app/                        # App Router（ルーティング）
│   ├── layout.tsx             # 共通レイアウト
│   ├── page.tsx               # / (ランディングページ)
│   ├── globals.css            # グローバルスタイル
│   │
│   ├── login/
│   │   └── page.tsx           # /login
│   ├── dashboard/
│   │   └── page.tsx           # /dashboard
│   ├── diagnosis/
│   │   └── page.tsx           # /diagnosis
│   ├── quiz/
│   │   └── page.tsx           # /quiz
│   │
│   ├── api/                   # API Routes
│   │   ├── health/
│   │   │   └── route.ts       # GET /api/health
│   │   ├── diagnosis/
│   │   │   └── route.ts       # POST /api/diagnosis
│   │   ├── quiz/
│   │   │   └── route.ts       # GET, POST /api/quiz
│   │   └── cron/
│   │       └── generate-quiz/
│   │           └── route.ts   # POST /api/cron/generate-quiz
│   │
│   └── auth/
│       └── callback/
│           └── route.ts       # OAuth コールバック
│
├── views/                      # ページコンポーネント（FSD pages 相当）
├── widgets/                    # 大規模UI（header / site-footer 等）
├── features/                   # ビジネス機能
├── entities/                   # ビジネスエンティティ
├── shared/                     # 共通ユーティリティ・UI
│   └── ui/
│       ├── typography/        # Typography（使用必須）
│       ├── icons/             # アイコンシステム
│       └── cta-button/
│
├── lib/                        # ユーティリティ
│   ├── auth-context.tsx       # 認証コンテキスト
│   ├── gemini.ts              # Gemini API
│   ├── guest-storage.ts       # ゲストユーザー用ストレージ
│   └── supabase/
│       ├── client.ts          # クライアント用
│       ├── server.ts          # サーバー用
│       └── admin.ts           # 管理者用
│
├── types/                      # 型定義
│   ├── database.types.ts      # Supabase自動生成
│   └── supabase.ts            # カスタム型
│
└── middleware.ts               # ミドルウェア（認証チェック）
```

---

## App Router の基本

### 📚 学習ポイント: ファイル規約

| ファイル名 | 用途 |
|-----------|------|
| `page.tsx` | ルートのUIを定義 |
| `layout.tsx` | 共有レイアウト（ネスト可能） |
| `loading.tsx` | ローディングUI |
| `error.tsx` | エラーUI |
| `not-found.tsx` | 404ページ |
| `route.ts` | API エンドポイント |

### ページの例

```typescript
// app/quiz/page.tsx
export default function QuizPage() {
  return (
    <div>
      <h1>デイリークイズ</h1>
      <QuizCard />
    </div>
  )
}
```

### 📚 学習ポイント: Server vs Client Components

```typescript
// ===== Server Component（デフォルト）=====
// - サーバーでのみ実行
// - DBアクセス、API呼び出しが可能
// - useState, useEffect は使えない
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .single()

  return <div>{data.name}</div>
}

// ===== Client Component =====
// - ブラウザで実行
// - useState, useEffect が使える
// - DB直接アクセスは不可
'use client'
export default function Counter() {
  const [count, setCount] = useState(0) // OK
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

**判断基準**:
- インタラクティブ（クリック、入力）→ Client Component
- データフェッチのみ → Server Component

---

## API Route の実装

### 基本パターン

```typescript
// app/api/hello/route.ts
import { NextResponse } from 'next/server'

// GET /api/hello
export async function GET() {
  return NextResponse.json({ message: 'Hello!' })
}

// POST /api/hello
export async function POST(request: Request) {
  const body = await request.json()
  return NextResponse.json({ received: body })
}
```

### 📚 学習ポイント: Request オブジェクト

```typescript
export async function POST(request: Request) {
  // JSONボディを取得
  const body = await request.json()

  // クエリパラメータを取得
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  // ヘッダーを取得
  const authHeader = request.headers.get('Authorization')

  // Cookieを取得
  const cookie = request.cookies.get('session')

  return NextResponse.json({ /* ... */ })
}
```

### 実装例: クイズAPI

```typescript
// app/api/quiz/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 今日のクイズを取得
export async function GET() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_quizzes')
    .select('*')
    .eq('date', today)
    .single()

  if (error) {
    return NextResponse.json(
      { error: 'Quiz not found' },
      { status: 404 }
    )
  }

  // 正解は隠す
  const { correct_option_id, ...quiz } = data
  return NextResponse.json(quiz)
}

// POST: 回答を送信
export async function POST(request: Request) {
  const body = await request.json()
  const { quizDate, selectedOptionId } = body

  // バリデーション
  if (!quizDate || !selectedOptionId) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // 正誤判定と経験値更新...

  return NextResponse.json({
    isCorrect: true,
    explanation: '...'
  })
}
```

### CRONエンドポイントの保護

Cloud Scheduler はリクエストに OIDC トークン（`Authorization: Bearer …`）を付けて呼びます。アプリはその署名を Google の公開鍵で確かめ、発行元の SA が `api-scheduler` であることを確認します（[実装](../../web/src/shared/lib/verify-scheduler-token.ts)）。以前の `CRON_SECRET` を共有する方式は、値が tfstate に平文で残るため廃止しました（[移行の記録](../issues/CLOUD_SCHEDULER_OIDC_MIGRATION.md)）。

```typescript
// app/api/cron/generate-prediction/route.ts（抜粋）
import { verifySchedulerToken } from "@/shared/lib/verify-scheduler-token"

export async function POST(request: Request) {
  const isValid = await verifySchedulerToken(request.headers.get("authorization"))
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 予測トレーニングの生成処理...
}
```

---

## コンポーネント設計

### フォルダ構成

コンポーネントは Feature-Sliced Design (FSD) のレイヤーに従って配置します（詳細: [FSDアーキテクチャ](../architecture/FRONTEND_ARCHITECTURE.md)）。

```
src/
├── widgets/            # 大規模な独立UI
│   ├── header/         # Header / PageHeader（HeaderActions / MobileMenu 含む）
│   └── site-footer/
│
└── shared/ui/          # 汎用UIコンポーネント（CVAベース）
    ├── typography/     # Typography（テキスト実装で使用必須）
    ├── icons/          # アイコンシステム
    ├── cta-button/
    ├── icon-container/
    └── alert-box/
```

### コンポーネントの例

```typescript
// shared/ui/button/Button.tsx
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  onClick?: () => void
}

export function Button({
  children,
  variant = 'primary',
  disabled = false,
  onClick
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition'
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

### 📚 学習ポイント: Props の型定義

```typescript
// ❌ Bad: any型
function Button(props: any) { ... }

// ❌ Bad: 型なし
function Button(props) { ... }

// ✅ Good: interface で型定義
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
}
function Button({ children, onClick }: ButtonProps) { ... }
```

---

## 汎用UIコンポーネント（shared/ui）

### 概要

本プロジェクトでは、CVA（Class Variance Authority）を活用した汎用UIコンポーネントを shared/ui レイヤーに配置しています。

### 設計原則

- **再利用性**: 複数のwidgets/featuresから利用される基本UI
- **バリアント駆動**: CVAで状態・サイズ・スタイルを型安全に管理
- **Tailwind統合**: Canonical Classesとcn()で一貫性を保つ

### 主な共通コンポーネント

#### IconContainer

**用途**: アイコンを統一されたコンテナで表示

**バリアント**:
- `size`: sm(8x8) / md(10x10) / lg(12x12) / xl(14x14) / 2xl(16x16)
- `rounded`: sm(rounded-lg) / md(rounded-xl) / lg(rounded-2xl)
- `bgColor`: brand / accent / positive / negative / surface / gradient-brand など

**使用例**:
```tsx
import { IconContainer } from "@/shared/ui/icon-container"

<IconContainer size="md" rounded="md" bgColor="accent">
  <svg className="w-5 h-5 text-accent-600">...</svg>
</IconContainer>
```

#### AlertBox

**用途**: 情報・警告・エラー通知の表示

**バリアント**:
- `variant`: info(青) / success(緑) / warning(黄) / danger(赤) / neutral(グレー)
- `size`: compact / default / large

**使用例**:
```tsx
import { AlertBox } from "@/shared/ui/alert-box"

<AlertBox variant="info" size="default">
  <div className="flex items-start gap-3">
    <IconContainer>...</IconContainer>
    <div>情報メッセージ</div>
  </div>
</AlertBox>
```

#### SectionHeader

**用途**: セクション見出しの統一表示

**バリアント**:
- `variant`: default / info / success / warning / danger / brand
- `showBorder`: true（下線あり） / false（下線なし）

**使用例**:
```tsx
import { SectionHeader } from "@/shared/ui/section-header"
import { BookOpen } from "lucide-react"

<SectionHeader
  icon={<BookOpen size={24} />}
  title="基礎知識"
  variant="info"
  showBorder={true}
/>
```

### CVAコンポーネント実装パターン

#### 1. バリアント定義

```tsx
import { cva, type VariantProps } from "class-variance-authority"

export const componentVariants = cva("基本クラス", {
  variants: {
    size: {
      sm: "小さいサイズのクラス",
      md: "中サイズのクラス",
      lg: "大きいサイズのクラス",
    },
    variant: {
      primary: "プライマリバリアント",
      secondary: "セカンダリバリアント",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "primary",
  },
})
```

#### 2. Props型定義

```tsx
interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  children: React.ReactNode
  className?: string
}
```

#### 3. コンポーネント実装

```tsx
import { cn } from "@/lib/utils"

export function Component({ size, variant, className, children, ...props }: ComponentProps) {
  return (
    <div
      className={cn(componentVariants({ size, variant }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
```

#### 4. Public API定義

```tsx
// index.ts
export { Component, componentVariants } from "./Component"
```

### 既存コンポーネントからの移行例

**Before（手動実装）**:
```tsx
<div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-100">
  <svg className="w-5 h-5">...</svg>
</div>
```

**After（汎用コンポーネント使用）**:
```tsx
import { IconContainer } from "@/shared/ui/icon-container"

<IconContainer size="md" rounded="md" bgColor="accent">
  <svg className="w-5 h-5">...</svg>
</IconContainer>
```

### ベストプラクティス

1. **バリアント値はTailwindクラスを直接参照**
   - 良い例: `bg-brand-100`, `text-positive-600`
   - 悪い例: カスタムCSS変数を直接記述

2. **cn()で既存classNameとマージ**
   ```tsx
   className={cn(componentVariants({ variant, size }), className)}
   ```

3. **HTMLAttributesを継承して拡張性を確保**
   ```tsx
   extends React.HTMLAttributes<HTMLElement>
   ```

4. **バリアント定義もエクスポート（テストやStorybook用）**
   ```tsx
   export { Component, componentVariants }
   ```

---

## データフェッチ

### Server Component でのフェッチ

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  // サーバーサイドで直接DBアクセス
  const supabase = createClient()
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .single()

  return <Dashboard user={user} />
}
```

### Client Component でのフェッチ

```typescript
// features/quiz-data/api/fetchQuizData.ts
import { client } from '@/shared/api'
import type { QuizDataResponse } from '../model/types'

export async function fetchQuizData(): Promise<QuizDataResponse> {
  return client<QuizDataResponse>('/api/quiz')
}

// widgets/quiz-card/ui/QuizCard.tsx
'use client'

import { useEffect, useState } from 'react'
import { fetchQuizData } from '@/features/quiz-data'

export function QuizCard() {
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuizData()
      .then(data => {
        setQuiz(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to fetch quiz:', error)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>
  if (!quiz) return <div>No quiz today</div>

  return (
    <div>
      <h2>{quiz.quiz_question}</h2>
      {/* ... */}
    </div>
  )
}
```

---

## スタイリング（Tailwind CSS）

### 📚 学習ポイント: ユーティリティファースト

```tsx
// ❌ 従来のCSS
<div className="quiz-card">
  <h2 className="quiz-title">...</h2>
</div>

// ✅ Tailwind CSS
<div className="p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-800">...</h2>
</div>
```

### レスポンシブデザイン

```tsx
<div className="
  p-4             {/* デフォルト: padding 16px */}
  md:p-6          {/* 768px以上: padding 24px */}
  lg:p-8          {/* 1024px以上: padding 32px */}
">
```

### ダークモード

```tsx
<div className="
  bg-white        {/* ライトモード */}
  dark:bg-gray-800 {/* ダークモード */}
">
```

---

## エラーハンドリング

### API Route でのエラーハンドリング

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // バリデーション
    if (!body.required_field) {
      return NextResponse.json(
        { error: 'Validation failed', details: 'required_field is missing' },
        { status: 400 }
      )
    }

    // 処理...

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### コンポーネントでのエラーハンドリング

```typescript
// app/quiz/error.tsx
'use client'

export default function Error({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>エラーが発生しました</h2>
      <button onClick={reset}>再試行</button>
    </div>
  )
}
```

---

## テスト

### 単体テストの例

```typescript
// __tests__/lib/gamification.test.ts
import { calculateLevel } from '@/lib/gamification'

describe('calculateLevel', () => {
  it('returns level 1 for 0 experience', () => {
    expect(calculateLevel(0)).toBe(1)
  })

  it('returns level 2 for 50 experience', () => {
    expect(calculateLevel(50)).toBe(2)
  })

  it('returns level 5 for 500 experience', () => {
    expect(calculateLevel(500)).toBe(5)
  })
})
```

### テスト実行

```bash
pnpm test           # 全テスト実行
pnpm test --watch   # ウォッチモード
```

---

## 関連ドキュメント

- [システム構成](../architecture/OVERVIEW.md) - アーキテクチャ全体像
- [データベース設計](../architecture/DATABASE.md) - スキーマ定義
- [API一覧](../reference/API.md) - エンドポイント仕様
