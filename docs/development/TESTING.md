# テストガイド

このドキュメントでは、プロジェクトのテスト戦略と実行方法について説明します。

---

## テスト実行コマンド

### 全テスト実行

```bash
cd web
pnpm test
```

### ウォッチモード（開発中）

```bash
cd web
pnpm test:watch
```

### カバレッジ確認

```bash
cd web
pnpm test:coverage
```

カバレッジレポートは `web/coverage/` ディレクトリに生成されます。

### 特定のテストファイルを実行

```bash
cd web
pnpm test useLevel           # レベル計算のテストのみ
pnpm test format             # 日付フォーマットのテストのみ
```

---

## テスト戦略

本プロジェクトは **Testing Trophy** の原則に基づいています：

```
    /\
   /  \  E2E (少ない)
  /____\
 /      \ Integration (中程度)
/________\
 Unit Tests (多い - ビジネスロジック中心)
```

### ユニットテスト（現在の対象）

FSDアーキテクチャの各レイヤーに応じたテスト戦略を採用：

#### 1. エンティティ層 (`src/entities/`)

ビジネスロジックの中核。純粋関数中心で高カバレッジを目指す。

**テスト例**:
- レベル計算ロジック (`entities/user/model/useLevel.ts`)
- マイルストーン計算 (`entities/user/model/getNextCharacterMilestone.ts`)
- 難易度判定 (`entities/quiz/model/getDifficulty.ts`)

#### 2. フィーチャー層 (`src/features/`)

React Queryとの統合ロジックやAPI通信を含むため、モックを活用。

**対象サブディレクトリ**:
- `features/*/api/` - Supabase/Gemini API呼び出し
- `features/*/model/` - React Query統合（queryOptions, hooks）
- `features/*/lib/` - フィーチャー固有ユーティリティ

**テスト例**:
- `features/quiz-data/model/queryOptions.ts` - QueryKey生成ロジック
- `features/dashboard-data/api/fetchDashboardData.ts` - エラーハンドリング

#### 3. ウィジェット層 (`src/widgets/`)

複合UIコンポーネント。ロジックを含む部分のみテスト対象。

**テスト対象の判断基準**:
- 条件分岐が複雑なレンダリングロジック
- イベントハンドラー内の状態管理
- 算出プロパティ（計算ロジック）

**テスト対象外**:
- 純粋なプレゼンテーション（スタイリングのみ）
- 静的コンテンツ

#### 4. 共通ライブラリ (`src/shared/lib/`)

汎用ユーティリティ。全関数をテスト。

**テスト例**:
- 日付フォーマット (`shared/lib/date/format.ts`)
- 文字列操作ユーティリティ

#### 5. インフラ層 (`src/lib/`)

外部サービス連携。重要なエラーハンドリングを中心にテスト。

**テスト例**:
- レート制限 (`lib/gemini/retry.ts`)
- ゲストストレージ (`lib/guest-storage.ts`)

### 統合テスト（将来の拡張）

React Query + API の統合テスト

### E2Eテスト（将来の拡張）

UIコンポーネントの統合テスト

---

## テスト作成ガイドライン

### AAA パターンを使用する

すべてのテストは **Arrange-Act-Assert** パターンに従います：

```typescript
it("レベル2の閾値を計算する", () => {
  // Arrange - テストデータを準備
  const level = 2

  // Act - テスト対象の関数を実行
  const threshold = getThresholdForLevel(level)

  // Assert - 結果を検証
  expect(threshold).toBe(20)
})
```

### 境界値テストを忘れない

ビジネスロジックの境界値は必ずテストします：

```typescript
it("レベルアップの瞬間（経験値20）でレベル2になる", () => {
  const result = calculateLevel(20)
  expect(result.level).toBe(2)
  expect(result.expProgress).toBe(0)
})
```

### モックは最小限に

純粋関数はモック不要。外部依存（Date.now(), setTimeout）のみモック：

```typescript
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-02-09T00:00:00Z"))
})

afterEach(() => {
  vi.useRealTimers()
})
```

### テストの命名規則

- **ファイル名**: `{対象ファイル名}.test.ts`
- **テスト名**: 日本語で「何を」「どうすると」「どうなる」を明確に

```typescript
describe("calculateLevel", () => {
  describe("正常系", () => {
    it("経験値0の場合レベル1を返す", () => {
      // ...
    })
  })

  describe("境界値", () => {
    it("経験値20の場合レベル2で0%進捗を返す", () => {
      // ...
    })
  })

  describe("異常系", () => {
    it("マイナス経験値の場合レベル1を返す", () => {
      // ...
    })
  })
})
```

---

## テストファイルの配置規則

テストファイルは **テスト対象ファイルと同じディレクトリ** に配置します：

```
src/
├── entities/
│   └── user/
│       └── model/
│           ├── useLevel.ts
│           ├── useLevel.test.ts          # ← テストファイル
│
├── features/
│   └── quiz-data/
│       ├── api/
│       │   ├── fetchQuizzes.ts
│       │   └── fetchQuizzes.test.ts     # ← API層テスト
│       └── model/
│           ├── queryOptions.ts
│           └── queryOptions.test.ts     # ← モデル層テスト
│
├── widgets/
│   └── quiz-completion-card/
│       └── ui/
│           ├── QuizCompletionCard.tsx
│           └── QuizCompletionCard.test.tsx  # ← ロジック含むコンポーネントのみ
│
└── shared/
    └── lib/
        └── date/
            ├── format.ts
            └── format.test.ts           # ← 共通ユーティリティ
```

### 命名規則

- **拡張子**: `.test.ts` / `.test.tsx`（`.spec.*` も可）
- **配置**: テスト対象ファイルと同階層
- **除外設定**: vitest.config.tsで自動除外されるため、カバレッジ計算には影響しない

---

## カバレッジ目標

> **カバレッジ対象ファイル数**: 173ファイル（2026年2月時点）

| レイヤー | 目標カバレッジ | 対象ファイル数 | 備考 |
| ------- | ------------ | ----------- | ---- |
| `src/entities/` | 80%以上 | 14 | ビジネスロジックの中核 |
| `src/shared/lib/` | 80%以上 | 3 | 汎用ユーティリティ |
| `src/lib/` | 70%以上 | 24 | 外部連携・インフラ層 |
| `src/features/*/api/` | 50%以上 | 9 | API通信ロジック |
| `src/features/*/model/` | 60%以上 | 21 | React Query統合ロジック |
| `src/features/*/lib/` | 70%以上 | 1 | フィーチャー固有ユーティリティ |
| `src/widgets/` | 30%以上 | 70 | 複合UIコンポーネント |

### カバレッジ戦略の考え方

- **高カバレッジ優先（70-80%）**: 純粋関数・ビジネスロジック
- **中カバレッジ（50-60%）**: 外部依存を持つロジック（API, React Query）
- **低カバレッジ（30-50%）**: プレゼンテーション層（UI重視のコンポーネント）

---

## 避けるべきアンチパターン

### 1. 実装詳細のテスト

```typescript
// ❌ 悪い例
expect(component.state.internalCounter).toBe(5)

// ✅ 良い例
expect(calculateLevel(100).level).toBe(3)
```

### 2. 過度なモック

```typescript
// ❌ 悪い例
vi.mock('./useLevel')
vi.mock('./getLevelImagePath')

// ✅ 良い例
vi.setSystemTime(new Date('2026-02-09'))
```

### 3. 壊れやすいテスト

```typescript
// ❌ 悪い例
expect(error.message).toBe("エラーが発生しました: 詳細...")

// ✅ 良い例
expect(error.message).toContain("エラーが発生しました")
```

---

## CI連携

GitHub Actionsでは、プルリクエストごとに自動的にテストが実行されます：

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: cd web && pnpm test

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./web/coverage/lcov.info
```

---

## トラブルシューティング

### テストが失敗する

1. **エラーメッセージを確認**: テスト結果の詳細を読む
2. **境界値を再確認**: レベル閾値の計算が正しいか確認
3. **モックの状態を確認**: `beforeEach`/`afterEach`でリセットされているか

### カバレッジが表示されない

```bash
# カバレッジディレクトリを削除して再実行
rm -rf web/coverage
pnpm test:coverage
```

### タイムアウトエラー

```typescript
// タイムアウト時間を延長
it("長時間かかるテスト", { timeout: 10000 }, async () => {
  // ...
})
```

---

## 参考リンク

- [Vitest公式ドキュメント](https://vitest.dev/)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [AAA パターン](https://automationpanda.com/2020/07/07/arrange-act-assert-a-pattern-for-writing-good-tests/)
