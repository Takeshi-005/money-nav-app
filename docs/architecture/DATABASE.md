# データベース設計

Supabase のスキーマ定義です。

---

## 💡 この設計から学べること

- **NoSQLデータモデリング**の基本パターン
- **読み取り回数を減らす**コスト最適化設計
- **ゲーミフィケーション**のデータ構造
- **AI出力との連携**を考慮した柔軟なスキーマ

---

## 設計方針

| 項目 | 方針 | 理由 |
|------|------|------|
| 正規化 | 適度に非正規化 | 読み取り回数を減らしてコスト削減 |
| ID設計 | 予測可能なIDを使用 | ユーザーは `uid`、クイズは日付 `YYYY-MM-DD` |
| タイムスタンプ | 全テーブルに設定 | デバッグ・監査に必要 |

### 📚 学習ポイント: NoSQLの非正規化

```
【RDBの正規化アプローチ】
users → user_profiles → user_settings
- 3回の読み取り（JOIN）が必要
- データの一貫性は保ちやすい

【NoSQLの非正規化アプローチ】
users (プロフィール・設定を埋め込み)
- 1回の読み取りで完結
- 更新時は注意が必要
```

Supabaseは読み取り回数で課金されるため、**非正規化で読み取り回数を減らす**のがベストプラクティス。

---

## テーブル一覧

| テーブル名 | 用途 | 読み取り頻度 |
|-----------|------|------------|
| `profiles` | ユーザープロフィール・経験値 | 高（ログイン時） |
| `diagnostics` | AI診断結果 | 中（診断時） |
| `daily_quizzes` | 毎日のクイズ（全ユーザー共通） | 高（クイズアクセス時） |
| `quiz_attempts` | ユーザーごとのクイズ回答履歴 | 中（履歴表示時） |
| `quiz_cache` | 中級・上級クイズキャッシュ | 中（クイズアクセス時） |
| `diagnosis_cache` | 診断回答パターンキャッシュ | 中（診断アクセス時） |
| `announcements` | お知らせ情報 | 中（ページ表示時） |
| `market_analyses` | 日経平均下落時のAI解説 | 低（解説閲覧時） |

---

## profiles テーブル

ユーザーのプロフィール情報とゲーミフィケーション用のステータス。

### 📚 設計ポイント: Supabase Authとの統合

```
Supabase では認証情報とプロフィール情報を分離:

auth.users (Supabase Auth管理)
- id, email, encrypted_password など
- システムが自動管理

public.profiles (アプリケーション管理)
- 経験値、レベル、投資スタイルなど
- アプリケーション固有の情報

→ auth.usersのidを外部キーとしてprofilesに紐付け
```

ユーザー登録時に `auth.users` レコードが作成されると、データベーストリガーで自動的に `profiles` レコードが生成されます。

### スキーマ

| カラム | 型 | 必須 | デフォルト | 説明 |
|--------|-----|------|----------|------|
| `id` | uuid | ✓ | - | ユーザーID（PK、FK → auth.users） |
| `display_name` | text | | null | 表示名 |
| `level` | integer | ✓ | 1 | 投資家レベル |
| `experience` | integer | ✓ | 0 | 累計経験値 |
| `investment_style` | text | | null | 投資スタイル（診断結果） |
| `watch_list` | text[] | | '{}' | 注目銘柄コードの配列 |
| `created_at` | timestamptz | ✓ | now() | 作成日時 |
| `is_admin` | boolean | | false | 管理者フラグ |

### 外部キー制約

```sql
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
```

ユーザーが削除されると、関連するprofilesレコードも自動削除されます。

### サンプルデータ

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "display_name": "田中太郎",
  "level": 5,
  "experience": 350,
  "investment_style": "堅実な守り手タイプ",
  "watch_list": ["7203", "NVDA"],
  "created_at": "2026-01-01T00:00:00Z",
  "is_admin": false
}
```

### 📚 実装例: プロフィール取得

```typescript
// src/lib/supabase/profiles.ts
import { createClient } from '@/lib/supabase/server'

export async function getProfile(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}
```

### 自動作成トリガー

ユーザー登録時に自動的にprofilesレコードを作成するトリガー関数:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, experience, investment_style)
  VALUES (NEW.id, 0, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### レベルアップ基準

| レベル | 必要経験値 | 累計経験値 |
|--------|----------|----------|
| 1 | 0 | 0 |
| 2 | 50 | 50 |
| 3 | 100 | 150 |
| 4 | 150 | 300 |
| 5 | 200 | 500 |
| 6〜 | +200ずつ増加 | ... |

### 📚 実装例: レベルアップ計算

```typescript
// src/lib/gamification.ts
export function calculateLevel(experience: number): number {
  if (experience < 50) return 1
  if (experience < 150) return 2
  if (experience < 300) return 3
  if (experience < 500) return 4

  // レベル5以降は200ごとに上がる
  return 5 + Math.floor((experience - 500) / 200)
}

export function getExpForNextLevel(level: number): number {
  if (level === 1) return 50
  if (level === 2) return 150
  if (level === 3) return 300
  if (level === 4) return 500
  return 500 + (level - 4) * 200
}
```

---

## diagnostics テーブル

AIによる詳細な診断結果。1ユーザー1レコード（更新型）。

### 📚 設計ポイント: なぜ別テーブル？

```
profilesテーブルに含めない理由:
- 診断結果はJSONで数KB
- profilesは頻繁に読み取られる
- 診断結果は診断時のみ必要

→ 分離することで通常の読み取りを高速化
```

### スキーマ

| カラム | 型 | 必須 | デフォルト | 説明 |
|--------|-----|------|----------|------|
| `id` | uuid | ✓ | gen_random_uuid() | レコードID（PK） |
| `user_id` | uuid | ✓ | - | ユーザーID（FK → auth.users、ユニーク制約） |
| `ai_result` | jsonb | ✓ | - | Gemini APIによる診断結果 |
| `updated_at` | timestamptz | ✓ | now() | 更新日時 |
| `created_at` | timestamptz | ✓ | now() | 作成日時 |

### 外部キー制約

```sql
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
UNIQUE (user_id)  -- 1ユーザー1診断結果
```

### ai_result 構造

```typescript
{
  investment_type: string,              // 投資家タイプ名
  description: string,                  // タイプの説明
  strengths: string[],                  // 強み
  weaknesses: string[],                 // 弱み（注意点）
  recommended_assets: string[],         // 推奨アセット
  recommended_sectors: string[],        // 推奨セクター
  suggested_tickers: Array<{
    code: string,
    name: string,
    reason: string
  }>,
  advice: string                        // アドバイス
}
```

### サンプルデータ

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "abc12345-e29b-41d4-a716-446655440000",
  "ai_result": {
    "investment_type": "堅実な守り手タイプ",
    "description": "リスクを抑えつつ、着実に資産を増やしたいタイプです。",
    "strengths": ["長期視点", "配当重視", "感情に流されない"],
    "weaknesses": ["成長機会を逃す可能性", "インフレに弱い"],
    "recommended_assets": ["国内株式", "債券", "不動産"],
    "recommended_sectors": ["ヘルスケア", "生活必需品", "公益事業"],
    "suggested_tickers": [
      {"code": "PG", "name": "P&G", "reason": "65年連続増配の配当王"},
      {"code": "9433", "name": "KDDI", "reason": "株主優待と安定配当が魅力"}
    ],
    "advice": "長期投資で配当を重視し、市場の波に一喜一憂せず、堅実に資産形成を進めることをおすすめします。"
  },
  "created_at": "2026-01-10T15:30:00Z",
  "updated_at": "2026-01-10T15:30:00Z"
}
```

### 📚 実装例: 診断結果の保存（Upsert）

```typescript
// src/lib/supabase/diagnostics.ts
import { createClient } from '@/lib/supabase/server'

export async function saveDiagnosticResult(
  userId: string,
  aiResult: object
) {
  const supabase = await createClient()

  // upsert: 存在すれば更新、なければ挿入
  const { data, error } = await supabase
    .from('diagnostics')
    .upsert({
      user_id: userId,
      ai_result: aiResult,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'  // user_id が重複したら更新
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

---

## daily_quizzes テーブル

毎朝バッチで生成される日次クイズ。**全ユーザー共通**。

### 📚 設計ポイント: なぜ日付をPKに？

```
❌ 自動採番ID (uuid)
daily_quizzes/550e8400-e29b-41d4-a716-446655440000
→ 今日のクイズを取得するのに検索が必要

✅ 日付をID
daily_quizzes/2026-01-13
→ 日付から直接アクセス可能（検索不要）
```

**予測可能なID**を使うことで、クエリコストを削減。

### スキーマ

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| `date` | string | ✓ | クイズの日付 `YYYY-MM-DD`（PK） |
| `news_source` | string | | ニュースソース名 |
| `news_title` | string | ✓ | ニュースタイトル |
| `news_summary` | text | ✓ | ニュース要約（3行程度） |
| `target_sector` | string | | 対象セクター |
| `quiz_question` | text | ✓ | クイズの問題文 |
| `options` | jsonb | ✓ | 選択肢の配列 |
| `correct_option_id` | integer | ✓ | 正解の選択肢ID |
| `explanation` | text | ✓ | 解説文 |
| `created_at` | timestamp | ✓ | 作成日時 |

### サンプルデータ

```json
{
  "date": "2026-01-13",
  "news_source": "ロイター通信",
  "news_title": "米CPI発表、市場予想を上回る",
  "news_summary": "米国の消費者物価指数が前年同月比3.5%上昇し、市場予想の3.2%を上回った。FRBの利下げ観測が後退している。",
  "target_sector": "ハイテク株",
  "quiz_question": "金利上昇懸念となるこのニュースは、ハイテク株にとってどう判断される？",
  "options": [
    {"id": 1, "text": "ポジティブ（株価上昇要因）"},
    {"id": 2, "text": "ネガティブ（株価下落要因）"},
    {"id": 3, "text": "影響なし"}
  ],
  "correct_option_id": 2,
  "explanation": "金利が上がると、将来の利益を現在価値に割り引く際のレートが高くなり、成長期待で買われるハイテク株は割高と判断されやすくなります。",
  "created_at": "2026-01-13T07:00:00Z"
}
```

### 📚 実装例: 今日のクイズ取得

```typescript
// src/lib/supabase/quiz.ts
export async function getTodayQuiz() {
  const today = new Date().toISOString().split('T')[0] // "2026-01-13"

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('daily_quizzes')
    .select('*')
    .eq('date', today)  // 日付で直接取得
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // レコードが見つからない
      return null
    }
    throw error
  }

  return data
}
```

---

## quiz_attempts テーブル

ユーザーごとのクイズ回答履歴。

### 📚 設計ポイント: 複合ユニーク制約

```sql
-- 同じユーザーが同じ日・同じタイプのクイズに2回答えるのを防ぐ
UNIQUE (user_id, quiz_date, quiz_type)
```

これにより、重複回答を**DBレベルで防止**。

### スキーマ

| カラム | 型 | 必須 | デフォルト | 説明 |
|--------|-----|------|----------|------|
| `id` | uuid | ✓ | gen_random_uuid() | レコードID（PK） |
| `user_id` | uuid | ✓ | - | ユーザーID（FK → auth.users） |
| `quiz_date` | date | ✓ | - | クイズの日付 |
| `quiz_type` | text | ✓ | 'news' | クイズタイプ（news, basic, scenario） |
| `is_correct` | boolean | ✓ | - | 正解かどうか |
| `choice_selected` | integer | ✓ | - | 選択した選択肢ID |
| `created_at` | timestamptz | ✓ | now() | 回答日時 |

### 外部キー制約

```sql
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
UNIQUE (user_id, quiz_date, quiz_type)  -- 1ユーザー1日1タイプにつき1回
```

### インデックス

```sql
CREATE INDEX idx_quiz_attempts_user_date ON quiz_attempts(user_id, quiz_date DESC);
```

### quiz_type の値

| 値 | 説明 |
|----|------|
| `news` | ニュースクイズ（時事問題） |
| `basic` | 基本クイズ（投資基礎知識） |
| `scenario` | シナリオクイズ（ケーススタディ） |

### サンプルデータ

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "abc12345-e29b-41d4-a716-446655440000",
  "quiz_date": "2026-01-13",
  "quiz_type": "news",
  "choice_selected": 2,
  "is_correct": true,
  "created_at": "2026-01-13T08:30:00Z"
}
```

### 経験値付与ルール

| 条件 | 獲得経験値 | 理由 |
|------|----------|------|
| 正解 | +10 | 学習の成果を評価 |
| 不正解 | +2 | 参加を促進（0だとモチベーション低下） |
| 連続正解3日 | +5 ボーナス | 継続を促進 |
| 連続正解7日 | +10 ボーナス | 習慣化を促進 |

### 📚 実装例: 回答処理とレベルアップ

```typescript
// src/lib/supabase/quiz.ts
import { createClient } from '@/lib/supabase/server'
import { calculateLevel } from '@/lib/gamification'

export async function submitQuizAnswer(
  userId: string,
  quizDate: string,
  quizType: 'news' | 'basic' | 'scenario',
  choiceSelected: number,
  isCorrect: boolean
) {
  const supabase = await createClient()

  const gainedExp = isCorrect ? 10 : 2

  // 1. 回答履歴を保存
  const { error: attemptError } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: userId,
      quiz_date: quizDate,
      quiz_type: quizType,
      choice_selected: choiceSelected,
      is_correct: isCorrect,
    })

  if (attemptError) {
    if (attemptError.code === '23505') {
      // 重複エラー（既に回答済み）
      throw new Error('Already answered this quiz')
    }
    throw attemptError
  }

  // 2. ユーザーの経験値を更新
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('experience, level')
    .eq('id', userId)
    .single()

  if (profileError) throw profileError

  const newExperience = profile.experience + gainedExp
  const newLevel = calculateLevel(newExperience)

  await supabase
    .from('profiles')
    .update({
      experience: newExperience,
      level: newLevel,
    })
    .eq('id', userId)

  return {
    isCorrect,
    gainedExp,
    newExperience,
    newLevel,
    leveledUp: newLevel > profile.level
  }
}
```

---

## quiz_cache テーブル

中級・上級クイズのキャッシュ。1日ごとに難易度別に保存。

### 📚 設計ポイント: キャッシュの必要性

```
daily_quizzes は初級（全ユーザー共通）
quiz_cache は中級・上級（ユーザーレベルに応じて変動）

キャッシュする理由:
- Gemini APIへのリクエスト削減（無料枠の節約）
- 同じ日・同じ難易度なら同じクイズを返す
- 1日1回の再生成で十分

→ 1日ごと・難易度ごとにキャッシュ
```

### スキーマ

| カラム | 型 | 必須 | デフォルト | 説明 |
|--------|-----|------|----------|------|
| `id` | uuid | ✓ | gen_random_uuid() | レコードID（PK） |
| `date` | date | ✓ | - | クイズ日付 |
| `difficulty` | text | ✓ | - | 難易度（intermediate, advanced） |
| `content` | jsonb | ✓ | - | クイズコンテンツ |
| `created_at` | timestamptz | ✓ | now() | 作成日時 |

### ユニーク制約

```sql
UNIQUE (date, difficulty)  -- 1日1難易度につき1レコード
```

### インデックス

```sql
CREATE INDEX idx_quiz_cache_date_difficulty ON quiz_cache(date, difficulty);
```

### difficulty の値

| 値 | 説明 | 対象ユーザー |
|----|------|-------------|
| `intermediate` | 中級 | レベル 5〜9 |
| `advanced` | 上級 | レベル 10+ |

### content 構造

```typescript
{
  news: {
    question: string,
    choices: Array<{ id: number, text: string }>,
    correctAnswer: number,
    explanation: string
  },
  basic: {
    question: string,
    choices: Array<{ id: number, text: string }>,
    correctAnswer: number,
    explanation: string
  },
  scenario: {
    question: string,
    choices: Array<{ id: number, text: string }>,
    correctAnswer: number,
    explanation: string
  }
}
```

### サンプルデータ

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2026-01-13",
  "difficulty": "intermediate",
  "content": {
    "news": {
      "question": "米国CPIが予想を上回った場合、為替市場への影響は？",
      "choices": [
        {"id": 1, "text": "ドル高・円安"},
        {"id": 2, "text": "ドル安・円高"},
        {"id": 3, "text": "影響なし"}
      ],
      "correctAnswer": 1,
      "explanation": "CPI上昇→金利上昇観測→ドル高"
    },
    "basic": {...},
    "scenario": {...}
  },
  "created_at": "2026-01-13T00:00:00Z"
}
```

### 📚 実装例: キャッシュの取得または生成

```typescript
// src/lib/supabase/quiz-cache.ts
import { createClient } from '@/lib/supabase/server'
import { generateQuizWithGemini } from '@/lib/gemini'

export async function getOrCreateQuizCache(
  date: string,
  difficulty: 'intermediate' | 'advanced'
) {
  const supabase = await createClient()

  // 1. キャッシュを確認
  const { data: cached, error: cacheError } = await supabase
    .from('quiz_cache')
    .select('content')
    .eq('date', date)
    .eq('difficulty', difficulty)
    .single()

  if (!cacheError && cached) {
    return cached.content
  }

  // 2. キャッシュがなければ生成
  const content = await generateQuizWithGemini(difficulty)

  // 3. キャッシュに保存
  await supabase
    .from('quiz_cache')
    .insert({
      date,
      difficulty,
      content
    })

  return content
}
```

### RLSポリシー

```sql
-- 誰でも閲覧可能
CREATE POLICY "Anyone can view quiz cache"
  ON quiz_cache
  FOR SELECT
  USING (true);
```

---

## diagnosis_cache テーブル

投資スタイル診断の回答パターンキャッシュ。同じ回答内容であれば Gemini API を呼び出さずキャッシュから返却する。

### スキーマ

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| `answer_key` | text | ✓ | 回答パターンキー（PK）。9パラメータを辞書順ソートして連結した文字列 |
| `ai_result` | jsonb | ✓ | Gemini が生成した診断結果 |
| `created_at` | timestamptz | ✓ | 作成日時 |

### answer_key の形式

```
"budget:1|decisionBasis:chart|lossReaction:hold|period:long|purpose:fire|region:japan|riskTolerance:high|style:growth|volatilityResponse:analyze"
```

### RLSポリシー

- 読み取り: 全員可能（ゲストユーザー含む）
- 書き込み: Service Role のみ

### キャッシュ有効期限

現在は**永続キャッシュ**（有効期限なし）。診断コンテンツの大幅改修時は手動でテーブルをクリアする。

---

## announcements テーブル

サービスのお知らせ情報。

### 📚 設計ポイント: 管理画面レス

```
お知らせの更新方法:
- 管理画面は作らない（開発コスト削減）
- Supabaseダッシュボードから直接編集
- RLSでアクティブなもののみ表示

→ シンプルなCMS的な使い方
```

### スキーマ

| カラム | 型 | 必須 | デフォルト | 説明 |
|--------|-----|------|----------|------|
| `id` | uuid | ✓ | gen_random_uuid() | レコードID（PK） |
| `title` | text | ✓ | - | お知らせタイトル |
| `description` | text | ✓ | - | お知らせ本文 |
| `link_url` | text | | null | リンク先URL（任意） |
| `link_text` | text | | null | リンクテキスト（任意） |
| `is_active` | boolean | ✓ | true | 表示フラグ |
| `display_order` | integer | ✓ | 0 | 表示順序（昇順） |
| `created_at` | timestamptz | ✓ | now() | 作成日時 |

### インデックス

```sql
CREATE INDEX idx_announcements_active_order ON announcements(is_active, display_order);
```

### サンプルデータ

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "投資スタイル診断機能リリース",
  "description": "9つの質問から8タイプの投資家スタイルを分析します。",
  "link_url": "/diagnosis",
  "link_text": "診断を試す",
  "is_active": true,
  "display_order": 0,
  "created_at": "2026-01-13T00:00:00Z"
}
```

### 📚 実装例: アクティブなお知らせ取得

```typescript
// src/lib/supabase/announcements.ts
import { createClient } from '@/lib/supabase/server'

export async function getActiveAnnouncements() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) throw error
  return data
}
```

### RLSポリシー

```sql
-- 読み取り: 有効なもののみ全員閲覧可能
CREATE POLICY "Anyone can read active announcements"
  ON announcements
  FOR SELECT
  USING (is_active = true);

-- 書き込み: サービスロール（admin）のみ
-- Service RoleはRLSをバイパスするため、明示的なポリシーは不要
```

### 管理方法

お知らせの追加・編集は Supabase ダッシュボードから：

1. Supabase ダッシュボード → Table Editor → `announcements`
2. 新規行を追加または既存行を編集
3. `is_active` を `false` にすることで非表示化

---

## market_analyses テーブル

日経平均下落時のAI解説を保存します。

### スキーマ

| カラム | 型 | 必須 | 説明 |
|--------|-----|------|------|
| `id` | uuid | ✓ | レコードID（PK） |
| `date` | DATE | ✓ | 解説日付（ユニーク） |
| `nikkei_close` | DECIMAL(10,2) | ✓ | 日経平均終値 |
| `nikkei_change_percent` | DECIMAL(5,2) | ✓ | 前日比変動率 |
| `analysis_content` | JSONB | ✓ | 解説コンテンツ |
| `created_at` | TIMESTAMPTZ | ✓ | 作成日時 |

### インデックス

```sql
CREATE INDEX idx_market_analyses_date ON market_analyses(date DESC);
```

### RLSポリシー

- 読み取り: 全員可能
- 書き込み: サービスロール（バッチ処理）のみ

### analysis_content 構造

```typescript
{
  summary: string,                    // 100文字以内の概要
  factors: Array<{
    category: "macro" | "us_market" | "forex" | "sector" | "other",
    title: string,
    description: string
  }>,
  checklist: Array<{
    question: string,
    guidance: string,
    isWarningSign: boolean
  }>,
  scenarios: {
    bullish: {
      title: string,
      description: string,
      conditions: string[]
    },
    bearish: {
      title: string,
      description: string,
      conditions: string[]
    }
  },
  beginnerAdvice: {
    dos: string[],
    donts: string[]
  },
  sectorAnalysis?: Array<{          // 将来の拡張用
    sector: string,
    impact: "positive" | "negative" | "neutral",
    description: string
  }>
}
```

### クエリ例

```sql
-- 最新の解説を取得
SELECT * FROM market_analyses
ORDER BY date DESC
LIMIT 1;

-- 特定日の解説を取得
SELECT * FROM market_analyses
WHERE date = '2026-01-29';

-- 解説が存在する日付リスト
SELECT date FROM market_analyses
ORDER BY date DESC
LIMIT 30;
```

---

## ER図

```mermaid
erDiagram
    AUTH_USERS ||--|| profiles : "1:1"
    AUTH_USERS ||--o| diagnostics : "1:0..1"
    AUTH_USERS ||--o{ quiz_attempts : "1:many"

    AUTH_USERS {
        uuid id PK "Supabase Auth管理"
        string email
        timestamptz created_at
    }

    profiles {
        uuid id PK_FK "→ auth.users(id)"
        text display_name
        integer level
        integer experience
        text investment_style
        text_array watch_list
        boolean is_admin
        timestamptz created_at
    }

    diagnostics {
        uuid id PK
        uuid user_id FK_UK "→ auth.users(id) UNIQUE"
        jsonb ai_result
        timestamptz updated_at
        timestamptz created_at
    }

    daily_quizzes {
        uuid id PK
        date date UK "UNIQUE"
        jsonb content
        timestamptz created_at
    }

    quiz_attempts {
        uuid id PK
        uuid user_id FK "→ auth.users(id)"
        date quiz_date
        text quiz_type "news|basic|scenario"
        boolean is_correct
        integer choice_selected
        timestamptz created_at
    }

    quiz_cache {
        uuid id PK
        date date
        text difficulty "intermediate|advanced"
        jsonb content
        timestamptz created_at
    }

    diagnosis_cache {
        text answer_key PK "回答パターンキー"
        jsonb ai_result
        timestamptz created_at
    }

    announcements {
        uuid id PK
        text title
        text description
        text link_url
        text link_text
        boolean is_active
        integer display_order
        timestamptz created_at
    }

    market_analyses {
        uuid id PK
        date date UK "UNIQUE"
        decimal nikkei_close
        decimal nikkei_change_percent
        jsonb analysis_content
        timestamptz created_at
    }
```

---

## インデックス設計

### 📚 学習ポイント: インデックスの考え方

```
【インデックスが効果的なケース】
- WHERE句で頻繁に検索するカラム
- ORDER BY で並び替えるカラム
- 外部キーカラム

【インデックスを避けるべきケース】
- 更新頻度が高いカラム（インデックス更新コストがかかる）
- カーディナリティが低いカラム（true/false など）
```

### 推奨インデックス

| テーブル | インデックス | 理由 |
|---------|------------|------|
| profiles | `id` (PK) | ユーザー検索 |
| profiles | `experience DESC` | レベルランキング |
| profiles | `level DESC` | レベル別フィルタ |
| diagnostics | `user_id` | 診断結果取得 |
| daily_quizzes | `date` (UNIQUE) | 日付でクイズ取得 |
| quiz_attempts | `user_id, quiz_date DESC` | ユーザー履歴検索 |
| quiz_cache | `date, difficulty` | キャッシュ検索 |
| diagnosis_cache | `answer_key` (PK) | 回答パターン一致検索 |
| announcements | `is_active, display_order` | アクティブなお知らせの順序取得 |
| market_analyses | `date DESC` | 最新の解説取得 |

---

## マイグレーション例

### 初期スキーマ（マイグレーション001）

```sql
-- ============================================
-- 1. profiles テーブル
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  experience INTEGER DEFAULT 0,
  investment_style TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_experience ON public.profiles(experience DESC);

-- ============================================
-- 2. diagnostics テーブル
-- ============================================
CREATE TABLE public.diagnostics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_result JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_diagnostics_user_id ON public.diagnostics(user_id);

-- ============================================
-- 3. daily_quizzes テーブル
-- ============================================
CREATE TABLE public.daily_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_daily_quizzes_date ON public.daily_quizzes(date DESC);

-- ============================================
-- 4. quiz_attempts テーブル
-- ============================================
CREATE TABLE public.quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_date DATE NOT NULL,
  quiz_type TEXT NOT NULL DEFAULT 'news',
  is_correct BOOLEAN NOT NULL,
  choice_selected INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quiz_date, quiz_type)
);

CREATE INDEX idx_quiz_attempts_user_date ON public.quiz_attempts(user_id, quiz_date DESC);

-- ============================================
-- 5. profiles自動作成トリガー
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, experience, investment_style)
  VALUES (NEW.id, 0, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

詳細なマイグレーションファイルは `docs/database/migrations/` を参照してください。

---

## 関連ドキュメント

- [システム構成](./OVERVIEW.md) - アーキテクチャ全体像
- [API一覧](../reference/API.md) - エンドポイント仕様
- [環境変数](../setup/SECRETS.md) - DB接続情報
