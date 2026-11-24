# Feature-Sliced Design アーキテクチャ

本プロジェクトのフロントエンドは **Feature-Sliced Design (FSD)** アーキテクチャに基づいて設計されています。

> 公式ドキュメント: https://feature-sliced.design/

---

## 1. 概要

### 1.1 Feature-Sliced Design とは

FSD は、フロントエンドアプリケーションを**レイヤー**、**スライス**、**セグメント**の3つの概念で構造化するアーキテクチャ手法です。

```
┌─────────────────────────────────────────────────────────────┐
│                          app                                │  ← プロバイダー、グローバル設定
├─────────────────────────────────────────────────────────────┤
│                         views                               │  ← ページコンポーネント
├─────────────────────────────────────────────────────────────┤
│                        widgets                              │  ← 大規模な独立UI
├─────────────────────────────────────────────────────────────┤
│                        features                             │  ← ビジネス機能
├─────────────────────────────────────────────────────────────┤
│                        entities                             │  ← ビジネスエンティティ
├─────────────────────────────────────────────────────────────┤
│                         shared                              │  ← 共通ユーティリティ
└─────────────────────────────────────────────────────────────┘
```

### 1.2 採用理由

| メリット | 説明 |
|---------|------|
| **高凝集・低結合** | 機能ごとに独立したモジュール |
| **スケーラビリティ** | チーム開発での並行作業が容易 |
| **保守性** | 変更の影響範囲を限定 |
| **テスト容易性** | 機能単位でのテストが可能 |

---

## 2. レイヤー構成

FSD は上位から下位への**一方向の依存関係**のみを許可します。

### 2.1 レイヤー一覧

| レイヤー | 責務 | 例 |
|---------|------|-----|
| **app** | アプリケーション初期化、プロバイダー、グローバル設定 | `providers/`, `styles/`, `routes/` |
| **views** | ページ全体のコンポジション（FSD標準の`pages`レイヤーをこの名称で運用） | `dashboard/`, `quiz/`, `investor-guide/` |
| **widgets** | 大規模で独立した機能のまとまり | `Header/`, `Sidebar/`, `QuizCard/` |
| **features** | ユーザー価値を提供する再利用可能な機能 | `submit-answer/`, `start-diagnosis/` |
| **entities** | ビジネスエンティティ（ドメインモデル） | `user/`, `quiz/`, `diagnosis/` |
| **shared** | 再利用可能な汎用機能 | `ui/`, `lib/`, `api/`, `config/` |

### 2.2 依存関係ルール

```
app → views → widgets → features → entities → shared
 ↓      ↓        ↓          ↓          ↓
 ◯      ◯        ◯          ◯          ◯
```

**ルール:**
- 上位レイヤーは下位レイヤーからのみインポート可能
- 同一レイヤー内のスライス間での相互依存は**禁止**
- `shared` 以外のレイヤーは必ずスライス内にセグメントを配置

---

## 3. Segment（セグメント）構成

各スライス内は以下のセグメントで構成されます。

| セグメント | 責務 | ファイル例 |
|-----------|------|-----------|
| **ui/** | UIコンポーネント、スタイル | `QuizCard.tsx`, `styles.css` |
| **model/** | ビジネスロジック、状態管理、型定義 | `store.ts`, `types.ts`, `hooks.ts` |
| **api/** | API通信、リクエスト関数 | `queries.ts`, `mutations.ts` |
| **lib/** | ユーティリティ関数 | `helpers.ts`, `formatters.ts` |
| **config/** | 設定、定数 | `constants.ts`, `config.ts` |

### 3.1 セグメント構成例

```
features/
└── submit-answer/
    ├── ui/
    │   ├── SubmitButton.tsx
    │   └── index.ts
    ├── model/
    │   ├── types.ts
    │   └── useSubmitAnswer.ts
    ├── api/
    │   └── submitAnswer.ts
    └── index.ts          ← Public API
```

---

## 4. Next.js App Router との統合

### 4.1 ディレクトリ構成

Next.js の `app/` フォルダと FSD の構造を共存させます。

```
├── app/                        # Next.js App Router（ルーティング専用）
│   ├── layout.tsx
│   ├── page.tsx               # → src/views/home から再エクスポート
│   ├── (main)/
│   │   ├── dashboard/
│   │   │   └── page.tsx       # → src/views/dashboard から再エクスポート
│   │   ├── quiz/
│   │   │   └── page.tsx       # → src/views/quiz から再エクスポート
│   │   ├── investor-guides/
│   │   │   └── page.tsx       # → src/views/investor-guide から再エクスポート
│   │   └── news-articles/
│   │       └── page.tsx       # → src/views/news-articles から再エクスポート
│   └── api/                    # Route Handlers
│       └── ...
│
└── src/                        # FSD 構造
    ├── app/                    # FSD app レイヤー
    │   ├── providers/
    │   │   ├── AuthProvider.tsx
    │   │   └── ThemeProvider.tsx
    │   └── styles/
    │       └── globals.css
    │
    ├── views/                  # FSD pages レイヤー相当（実装上はviews/を使用）
    │   ├── home/
    │   │   ├── ui/
    │   │   │   └── HomePage.tsx
    │   │   └── index.ts
    │   ├── dashboard/
    │   │   ├── ui/
    │   │   │   └── DashboardPage.tsx
    │   │   └── index.ts
    │   ├── quiz/
    │   │   ├── ui/
    │   │   │   └── QuizPage.tsx
    │   │   └── index.ts
    │   ├── investor-guide/     # ← 追加済み
    │   │   ├── ui/
    │   │   └── index.ts
    │   └── news-articles/      # ← 追加済み
    │       ├── ui/
    │       └── index.ts
    │
    ├── widgets/                # FSD widgets レイヤー
    │   ├── header/
    │   │   ├── ui/
    │   │   │   └── Header.tsx
    │   │   └── index.ts
    │   └── quiz-card/
    │       ├── ui/
    │       │   └── QuizCard.tsx
    │       └── index.ts
    │
    ├── features/               # FSD features レイヤー
    │   ├── submit-answer/
    │   │   ├── ui/
    │   │   ├── model/
    │   │   ├── api/
    │   │   └── index.ts
    │   └── start-diagnosis/
    │       └── ...
    │
    ├── entities/               # FSD entities レイヤー
    │   ├── user/
    │   │   ├── model/
    │   │   │   └── types.ts
    │   │   └── index.ts
    │   ├── quiz/
    │   │   ├── model/
    │   │   │   └── types.ts
    │   │   └── index.ts
    │   └── diagnosis/
    │       └── ...
    │
    └── shared/                 # FSD shared レイヤー
        ├── ui/                 # 共通UIコンポーネント
        │   ├── button/
        │   ├── card/
        │   └── ...
        ├── lib/                # ユーティリティ
        │   ├── utils.ts
        │   └── cn.ts
        ├── api/                # API クライアント
        │   ├── supabase/
        │   └── gemini/
        └── config/             # 設定
            └── constants.ts
```

#### shared/ui - UIコンポーネント

shared/ui レイヤーでは、CVA（Class Variance Authority）を活用した汎用UIコンポーネントを配置します。

**設計原則**:
- 複数のwidgets/featuresから利用される基本UI
- CVAでバリアントを型安全に管理
- Tailwind Canonical Classesと`cn()`で一貫性を保つ

**コンポーネント構造例**:
```
shared/ui/
├── icon-container/
│   ├── IconContainer.tsx    # メインコンポーネント
│   └── index.ts             # Public API
├── alert-box/
│   ├── AlertBox.tsx
│   └── index.ts
└── section-header/
    ├── SectionHeader.tsx
    └── index.ts
```

**Public API定義のルール**:
```typescript
// index.ts
export { IconContainer, iconContainerVariants } from "./IconContainer"
```

詳細: [UIコンポーネントAPIリファレンス](../reference/UI_COMPONENTS.md)

### 4.2 ページのエクスポート方法

```typescript
// app/(main)/dashboard/page.tsx
export { DashboardPage as default } from "@/views/dashboard"
// metadata はこのファイルで直接定義

// src/views/dashboard/index.ts
export { DashboardPage } from './ui/DashboardPage'
```

### 4.3 API Routes の配置

```
app/api/                        # Next.js Route Handlers
└── ...

src/app/api-routes/             # FSD での Route Handler 管理（オプション）
└── ...
```

---

## 5. Public API（公開インターフェース）

各スライスは `index.ts` で公開APIを定義します。

```typescript
// features/submit-answer/index.ts
export { SubmitButton } from './ui/SubmitButton'
export { useSubmitAnswer } from './model/useSubmitAnswer'
export type { SubmitAnswerParams } from './model/types'

// 内部実装は非公開
// ❌ import { internalHelper } from '@/features/submit-answer/lib/helper'
// ✅ import { SubmitButton } from '@/features/submit-answer'
```

---

## 6. 実装ガイドライン

### 6.1 新機能追加の手順

1. **対象レイヤーを決定**
   - ユーザーアクション → `features/`
   - ドメインモデル → `entities/`
   - 画面全体 → `views/`
   - 独立したUI → `widgets/`

2. **スライスを作成**
   ```bash
   mkdir -p src/features/new-feature/{ui,model,api}
   touch src/features/new-feature/index.ts
   ```

3. **セグメントに実装を配置**
   - `ui/`: React コンポーネント
   - `model/`: hooks, store, types
   - `api/`: fetch 関数

4. **Public API を定義**
   ```typescript
   // index.ts
   export { FeatureComponent } from './ui/FeatureComponent'
   ```

### 6.2 禁止事項

| NG | 理由 |
|----|------|
| 同一レイヤーの他スライスからインポート | 循環依存のリスク |
| `index.ts` を経由しない直接インポート | 内部実装の漏洩 |
| 上位レイヤーからのインポート | 依存方向の逆転 |

### 6.3 コード例

```typescript
// features/submit-answer/ui/SubmitButton.tsx
'use client'

import { Button } from '@/shared/ui/button'         // ✅ shared から
import { useSubmitAnswer } from '../model/useSubmitAnswer'  // ✅ 同一スライス内

export function SubmitButton({ quizId }: { quizId: string }) {
  const { submit, isLoading } = useSubmitAnswer()

  return (
    <Button onClick={() => submit(quizId)} isLoading={isLoading}>
      回答を送信
    </Button>
  )
}
```

```typescript
// features/submit-answer/model/useSubmitAnswer.ts
import { submitAnswerApi } from '../api/submitAnswer'
import type { Quiz } from '@/entities/quiz'  // ✅ 下位レイヤーから

export function useSubmitAnswer() {
  // ...実装
}
```

---

## 7. 段階的移行プラン

現在の構成から FSD への段階的移行を推奨します。

### Phase 1: shared レイヤーの整備
- `components/ui/` → `src/shared/ui/`（Typography / Icons / CtaButton）、`src/widgets/header/`（Header / PageHeader 系）に移行済み（#59 完了）
- `lib/` → `src/shared/lib/`, `src/shared/api/`（#60 で対応予定）

### Phase 2: entities レイヤーの作成
- `types/supabase.ts` の型を entities に分離
- `entities/user/`, `entities/quiz/`, `entities/diagnosis/`

### Phase 3: features レイヤーの作成
- ページ内のビジネスロジックを features に抽出
- `features/submit-answer/`, `features/start-diagnosis/`

### Phase 4: views レイヤーの整理（完了）
- `views/` として実装済み（FSD標準の `pages` レイヤーに相当）
- widgets と features を組み合わせて構成済み

---

## 8. 参考リンク

- [Feature-Sliced Design 公式](https://feature-sliced.design/)
- [FSD + Next.js ガイド](https://feature-sliced.design/docs/guides/tech/with-nextjs)
- [FSD Examples](https://github.com/feature-sliced/examples)
