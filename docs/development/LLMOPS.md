# LLMOps ガイド：AI生成コンテンツの品質管理

**LLMOps**（Large Language Model Operations）とは、LLMを使ったシステムの品質・信頼性を継続的に管理する運用手法です。
このドキュメントでは、ニュース解説・市場分析・クイズ・週間レビューの4種類のAI生成コンテンツに共通して適用している品質管理の仕組みを説明します。

---

## 💡 この設計から学べること

- **LLM出力の品質保証**に必要な3層のガードレール
- **LLM-as-a-Judge**（AIがAIの出力を採点する仕組み）による自動品質評価の実装パターン
- **フィードバック付きリトライ**で生成品質を反復改善する方法
- **グレースフルデグラデーション**（品質が最大でないとき、止まらずベストを返す設計）でシステムを止めないガードの設計

---

## 完全自動化サイクル

Cloud Scheduler のトリガーから Slack 通知まで、人手を介さずに以下のサイクルが毎日自動で実行されます。

```text
Cloud Scheduler（時刻トリガー）
    │
    ▼
Cron API（OIDC 認証）           ← Google が発行するトークンで、スケジューラ→APIのリクエストを認証する仕組み
    │
    ├── データ取得（日経平均 / ニュース記事 / 用語辞典）
    │
    ├── withFeedbackRetry()        ← 全コンテンツ共通インフラ
    │   ├── Attempt 1: generateAttempt()
    │   │   └── Judge → is_valid=true  → return ✅
    │   └── Attempt 2: generateAttempt(feedback)  ← Judge 否定時のみ
    │       └── Judge → best-effort return ⚠️
    │
    ├── writeObservabilityLogs()
    │   ├── ai_generations（試行ごと: 実行時間・ステータス・モデル）
    │   └── ai_evaluations（Judge スコア・error_type・feedback）
    │
    ├── Supabase upsert（コンテンツ保存）
    │
    └── Slack / 検索エンジン通知
```

### 全コンテンツ種別の対応

| content_type | Cron 実行時刻 | リトライ戦略 | 備考 |
|---|---|---|---|
| `news_article` | 平日 07:00 JST | `withFeedbackRetry` | 金曜は `weekly_review` も連鎖生成 |
| `market_analysis` | 毎日 16:00 JST | `withFeedbackRetry` | 変動率 ≥1% の条件あり |
| `quiz` | 毎日 21:00 JST | 直接実装（同等ロジック） | 直近7日の重複テーマ回避 |
| `weekly_review` | 金曜 07:00 JST | `withFeedbackRetry` | `news_article` Cron から連鎖 |

### 共通インフラ

| ファイル | 役割 |
|---|---|
| `lib/gemini/shared/with-feedback-retry.ts` | フィードバック付きリトライ（全コンテンツ共通） |
| `lib/gemini/shared/create-judge.ts` | Judge 生成ファクトリ（ジェネリクスで全機能対応） |
| `app/api/cron/*/route.ts` 内 `writeObservabilityLogs()` | 試行・評価を DB に記録 |

### 自動化が動いているか確認する

Supabase Dashboard → SQL Editor で当日の生成状況を確認できます。

```sql
-- 本日の生成試行サマリー
SELECT content_type, attempt_number, status, duration_ms
FROM ai_generations
WHERE generation_date = CURRENT_DATE
ORDER BY content_type, attempt_number;

-- Judge 否定が続くコンテンツを確認
SELECT g.content_type, e.error_type, e.feedback_for_retry
FROM ai_evaluations e
JOIN ai_generations g ON e.generation_id = g.id
WHERE g.generation_date = CURRENT_DATE
  AND e.is_valid = false
ORDER BY g.created_at DESC;
```

---

## なぜLLMOpsが必要か

LLMは「自信満々に間違ったことを出力する」ことがある。
特に金融教育コンテンツは、誤った知識を正しいと信じ込ませると **ユーザーの実際の投資判断に悪影響を与えるリスク** がある。

LLMOpsを入れない場合、以下のエラーがそのまま本番公開される：

| 問題の種類 | 例 | LLMOps前の検出 |
|---|---|---|
| 構造的エラー | JSON形式が壊れている、選択肢が2個しかない | ✅ Zodで検出できる |
| 内容品質エラー | 解説が10文字しかない、タイトルが空 | ❌ 素通りしてしまう |
| 意味的エラー | 正解IDが指す選択肢が実際には誤り、日本でなく米国の制度 | ❌ 素通りしてしまう |

LLMOps実装後はこの3種類すべてを自動でブロックする：

```text
Layer 1: HTTP Retry     ← 通信エラー（Vertex AIのタイムアウト等）
Layer 2: Zod Validate   ← 構造的エラー・内容品質エラー
Layer 3: LLM Judge      ← 意味的エラー（事実誤認・選択肢品質）
```

---

## アーキテクチャ

```
POST /api/cron/generate-quiz
│
├── 既存クイズ確認（is_published=true でフィルタ）
│
├── generateDailyQuizzes()
│   │
│   ├── [Attempt 1]
│   │   ├── generateAttempt()   ← callGeminiWithRetry (HTTP retry x3)
│   │   ├── Zod.parse()         ← 構造・品質バリデーション
│   │   └── judgeQuizzes()      ← LLM Judge (temperature=0.1)
│   │       ├── is_valid=true  → return (success)
│   │       └── is_valid=false → フィードバックを保持してAttempt 2へ
│   │
│   └── [Attempt 2] ← Judge失敗時のみ
│       ├── generateAttempt(judgeFeedback=前回の指摘)
│       ├── Zod.parse()
│       └── judgeQuizzes()
│           ├── is_valid=true  → return (success)
│           └── is_valid=false → ベストエフォートでreturn + WARNING log
│
├── writeObservabilityLogs()    ← ai_generations / ai_evaluations に記録
│
└── INSERT daily_quizzes (is_published=true デフォルト)
```

---

## 実装ファイル一覧

| ファイル | 役割 |
|---|---|
| `web/src/lib/gemini/quiz/schema.ts` | Zodスキーマ（Layer 2: 構造・品質バリデーション） |
| `web/src/lib/gemini/quiz/judge.ts` | LLM Judge（Layer 3: 意味的バリデーション） |
| `web/src/lib/gemini/quiz/generate.ts` | フィードバック付きリトライループ |
| `web/src/lib/gemini/quiz/prompt.ts` | プロンプト構築（`QUIZ_PROMPT_VERSION`、`judgeFeedback`注入） |
| `web/src/app/api/cron/generate-quiz/route.ts` | cronエントリーポイント・観測ログ書き込み |
| `docs/database/migrations/015_ai_observability.sql` | DBマイグレーション |

---

## Layer 2: Zodスキーマ（`schema.ts`）

```typescript
export const singleQuizSchema = z.object({
  quiz_type: z.enum(quizTypes),
  title: z.string().min(5).max(20),          // ← 空文字・極端に短いタイトルを排除
  question: z.string().min(20).max(200),
  options: z.array(z.object({
    id: z.number(),
    text: z.string().min(3),                  // ← 空の選択肢を排除
  })).length(3),
  correct_option_id: z.number().int().min(1).max(3), // ← 範囲外IDを排除
  explanation: z.string().min(30).max(400),   // ← 最低30文字の解説を要求
});
```

**Zodの役割はあくまで「形と量」のチェック**。内容の正しさはJudgeが担う。

---

## Layer 3: LLM-as-a-Judge（`judge.ts`）

**LLM-as-a-Judge** とは、生成 AI の出力を別の AI が採点・評価する手法。
人間が手動でレビューする代わりに、もう一つの Gemini インスタンスが「この出力は合格か？」を判定する。

### Judge出力スキーマ

```typescript
{
  thought: string            // 判定根拠（Chain-of-Thought）
  is_valid: boolean          // 合格/不合格
  scores: {
    factual_accuracy: 1-5    // 事実精度
    option_quality: 1-5      // 選択肢品質
    explanation_quality: 1-5 // 解説品質
    japan_relevance: 1-5     // 日本市場整合性
  }
  error_type: "factual_error" | "ambiguous_correct_answer" |
              "trivial_distractors" | "weak_explanation" |
              "japan_context_mismatch" | "duplicate_concept" | "none"
  feedback_for_retry: string // 再生成への具体的修正指示
  failing_quiz_indices: number[] // 問題のあるクイズのインデックス（0始まり）
}
```

### 判定基準

| 基準 | 内容 |
|---|---|
| 事実精度 | `correct_option_id`が指す選択肢が実際に正しいか |
| 選択肢品質 | 3択が明確に区別できるか（2択に見えないか） |
| 解説品質 | 「なぜ他の選択肢が誤りか」まで説明できているか |
| 日本市場整合性 | TSE/JPX/NISA/iDeCoなど日本固有の制度に矛盾がないか |

> `quiz_type="news"` は時事問題のため事実検証をスキップ。他の3基準のみ適用。

### なぜ `temperature: 0.1` か

Judgeは「創造的な判断」ではなく「一貫した評価」が求められる。
`temperature: 0` に近い値にすることで、同じクイズを2回評価したときに矛盾した判定を出しにくくなる。

### なぜ `responseSchema` を使わないか

```typescript
config: {
  responseMimeType: "application/json",  // ← JSON出力は指定
  // responseSchema は意図的に指定しない
  temperature: 0.1,
}
```

`responseSchema` でGeminiの出力形式を拘束すると、Geminiが「JSON構造に合わせるために推論を省略する」挙動を示すことがある。
`thought`フィールドのChain-of-Thoughtは、モデルが自由に推論した後に構造化出力させることで品質が向上する。

### グレースフルデグラデーション

**グレースフルデグラデーション**（Graceful Degradation）とは、一部のコンポーネントが失敗してもシステム全体を止めず、品質を落としながらも動作を継続させる設計思想。

Judge自体がAPIエラーを返した場合、クイズ生成をブロックしない：

```
Judge APIエラー
  └── return null
        └── generate.ts が null を受け取る
              └── "Judge失敗" = 通信問題とみなしてクイズをそのまま公開
                    └── WARNINGログのみ出力
```

---

## フィードバック付きリトライ（`generate.ts`）

Judge否定時、`feedback_for_retry` をプロンプト末尾に追記して再生成：

```
# 前回生成の問題点（必ず修正すること）
第0問のcorrect_option_idは2ではなく1が正しい。
PERが高い銘柄の特徴として「成長期待が高い」（選択肢1）が正しく、
「割安である」（選択肢2）は誤り。また第2問の選択肢2と3の区別が
曖昧です。より具体的な数値（例: 配当利回り3%）を使って差別化してください。
```

Geminiは「指摘→修正」という指示追従が得意なため、このフィードバックは有効に機能する。

**最大2回の試行**（初回 + フィードバック付きリトライ1回）。3回以上は Vertex AI コスト増になるため行わない。

---

## プロンプトバージョン管理

`prompt.ts` 先頭に定義された定数で管理：

```typescript
export const QUIZ_PROMPT_VERSION = "quiz-v2.0"
```

この値が `ai_generations.prompt_version` に記録される。
**プロンプトの実質的な変更時（カテゴリ追加・判定基準変更等）に手動でバンプする。**

バンプの目安：

| 変更内容 | バンプ要否 |
|---|---|
| 選択肢数の変更（3択→4択） | ✅ 必要 |
| カテゴリの追加・削除 | ✅ 必要 |
| 文字数制限の調整 | ✅ 必要 |
| 誤字修正・語句の微調整 | ❌ 不要 |

---

## 可観測性（DBスキーマ）

マイグレーション: `docs/database/migrations/015_ai_observability.sql`

### `ai_generations` テーブル

各生成試行を記録。`attempt_number > 1` はフィードバック付きリトライ。

| カラム | 型 | 内容 |
|---|---|---|
| `generation_date` | DATE | 生成対象の日付 |
| `prompt_version` | TEXT | プロンプトバージョン（例: "quiz-v2.0"） |
| `attempt_number` | INTEGER | 試行回数（1=初回、2=リトライ） |
| `model` | TEXT | 使用モデル（例: "gemini-2.5-flash"） |
| `input_context` | JSONB | 市場コンテキスト・難易度 |
| `duration_ms` | INTEGER | 生成にかかった時間（ms） |
| `status` | TEXT | `success` / `failed` / `retried` |

### `ai_evaluations` テーブル

Judgeの評価結果。`generation_id` で `ai_generations` に紐付く。

| カラム | 型 | 内容 |
|---|---|---|
| `is_valid` | BOOLEAN | Judge合格/不合格 |
| `scores` | JSONB | 4項目のスコア（1〜5） |
| `error_type` | TEXT | 検出された問題の種別 |
| `feedback_for_retry` | TEXT | 次回生成への修正指示 |
| `thought` | TEXT | JudgeのChain-of-Thought（デバッグ用） |

### `is_published` キルスイッチ

`daily_quizzes` と `quiz_cache` に追加されたカラム。

```sql
-- Supabase Dashboardで当日のクイズを非表示にする
UPDATE public.daily_quizzes
SET is_published = false
WHERE date = '2026-05-01';
```

`is_published = false` にするとAPIレスポンスからそのクイズが消え、
Cloud Schedulerの次回実行時に再生成される（既存チェックが `is_published = true` のみを対象とするため）。

---

## Cloud Loggingでの監視

### Judge否定が続く場合を検出

```sql
resource.type="cloud_run_revision"
jsonPayload.context.module="lib/gemini/quiz/generate"
severity="WARNING"
jsonPayload.message="Judge marked quiz invalid"
```

### リトライ発生率を確認

```sql
resource.type="cloud_run_revision"
jsonPayload.context.module="api/cron/generate-quiz"
jsonPayload.context.attempts > 1
```

### ベストエフォート公開（2回ともJudge否定）を検出

```sql
resource.type="cloud_run_revision"
jsonPayload.context.module="api/cron/generate-quiz"
jsonPayload.message="Published quiz with best-effort: Judge failed twice"
severity="WARNING"
```

---

## マイグレーション適用手順

### 1. SQL実行

Supabase Dashboard → SQL Editor で `015_ai_observability.sql` を実行、
またはCLIで：

```bash
supabase db push
```

### 2. 型ファイル再生成

```bash
pnpm supabase gen types typescript \
  --project-id <your-project-id> \
  > src/types/database.types.ts
```

### 3. `.filter()` を `.eq()` に戻す

型再生成後、型安全なクエリに更新：

```typescript
// generate-quiz/route.ts と quiz/route.ts の以下を変更
.filter("is_published", "eq", true)
// ↓
.eq("is_published", true)
```

---

## 関連ドキュメント

- [ロギングベストプラクティス](./LOGGING_BEST_PRACTICES.md) — Cloud Loggingの使い方
- [Cloud Logging](./CLOUD_LOGGING.md) — エラー監視の学習ガイド
- [データベース設計](../architecture/DATABASE.md) — テーブル一覧
