---
name: migration
description: >-
  このプロジェクトのSupabase DBマイグレーションを規約通りに作成する。
  「マイグレーション作成」「カラム追加」「テーブル追加」「スキーマ変更」「インデックス追加」「RLS変更」など、
  DBスキーマや既存データに対する変更が必要になったら必ずこのスキルを使う。
  ユーザーが「マイグレーション」と明示しなくても、実装の過程でDB変更が発生する場合は必ず従うこと。
  ファイル作成・型再生成・影響コード調査まで行う（DBへの適用自体はDashboardで手動）。
---

# DBマイグレーション作成（マネイッポ専用）

DBに対するあらゆる変更（スキーマ変更・データ正規化・RLS変更）は `docs/database/migrations/` に
SQLファイルとして残す。理由: ローカル/ステージング/本番すべてに同じ修正を再現可能にし、Gitで履歴を追跡するため。
`web/supabase/migrations/` は使わない（既存運用と異なるため）。

## 手順

### 1. 連番を決定する

```bash
ls docs/database/migrations/ | sort | tail -3
```

最大番号 +1 を3桁ゼロ埋めで使う。番号の重複・欠番チェックを怠ると後続のマイグレーションと衝突するため、
必ず実際のディレクトリを見て決める（記憶や会話履歴から推測しない）。

### 2. SQLファイルを作成する

配置: `docs/database/migrations/{3桁連番}_{snake_case_description}.sql`

冒頭ヘッダーは以下の形式に必ず揃える（既存ファイルと同一フォーマット）:

```sql
-- ============================================
-- Migration: {連番}_{name}
-- Description: 変更内容と目的を日本語で。方針変更を伴う場合はその理由も書く。
-- Created: YYYY-MM-DD
-- ============================================
```

SQL本文の規約:

- **冪等に書く**: `ADD COLUMN IF NOT EXISTS` / `DROP ... IF EXISTS` / `CREATE INDEX IF NOT EXISTS`。
  Dashboardでの手動実行は二重実行が起こりうるため。
- **COMMENT ON を付ける**: カラム/テーブルの意味・制約（例: 文字数上限、非予測ポリシー等）をDBに残す。
- **新規テーブルには RLS を忘れない**: `ENABLE ROW LEVEL SECURITY` とポリシー定義をセットで。
- **破壊的変更（DROP/型変更）**: ロールバック用SQLをコメントで併記するか、必要なら別ファイルで用意する。

### 3. 影響コードを調査する

migration を適用しても、コード側が列を読み書きしなければ UI に届かない
（過去の教訓: `key_concept` は migration 適用済みなのに API の insert/select に列が無く UI 未到達だった）。

テーブル名・カラム名で grep し、追補が必要な箇所を列挙してユーザーに提示する:

```bash
grep -rn "{テーブル名}" web/src --include="*.ts" --include="*.tsx" -l
```

特に確認する場所: API Route の select/insert 句、Gemini 抽出スキーマ（`schema.ts` / `prompt.ts`）、
エンティティ型定義、表示コンポーネント。

### 4. 適用はユーザーが Dashboard で手動実行

**CLI や MCP から DB に直接適用しない。** 適用経路は Supabase Dashboard → SQL Editor のみ（既存運用）。
ファイルを作成したら、適用してもらうようユーザーに依頼して待つ。

**「ファイルが存在する ≠ 適用済み」** — 適用確認が取れるまで次のステップに進まない。

### 5. 適用確認後に型を再生成する

ユーザーから適用完了の確認が取れてから実行する（適用前に実行しても新しいスキーマは型に反映されない）:

```bash
cd web && pnpm gen:types && pnpm type-check
```

### 6. 必要なら README にメモを残す

運用方針の変更を伴う migration（データ保存ポリシー変更、コード側追補が別タスクになる場合など）は、
`docs/database/README.md` の「最近の migration メモ」セクションに追記する。

## 完了時チェックリスト

作業の最後に必ず以下を出力し、状態を明示する:

- [ ] SQLファイル作成（連番・ヘッダー・冪等性）
- [ ] 影響コード調査済み（追補箇所を列挙 or 影響なしを確認）
- [ ] Dashboard で適用済み（ユーザー確認）
- [ ] `pnpm gen:types` + `pnpm type-check` 完了
- [ ] README メモ追記（不要なら理由を明示）
