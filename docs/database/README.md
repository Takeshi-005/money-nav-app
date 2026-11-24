# データベースマイグレーション

Supabaseデータベースのスキーマ管理用ディレクトリです。

## ディレクトリ構成

```
docs/database/
├── README.md          # このファイル
└── migrations/        # マイグレーションSQL
    ├── 001_*.sql      # 初期スキーマ
    ├── 002_*.sql      # 追加テーブル
    └── ...
```

## マイグレーションの適用方法

### 1. Supabase Dashboard にアクセス

https://supabase.com/dashboard → プロジェクト選択

### 2. SQL Editor を開く

左メニュー → **SQL Editor**

### 3. SQLを実行

`migrations/` 内のSQLファイルを**番号順**に実行

```
001_initial_schema.sql
003_announcements.sql
...
```

### 4. 実行済みを記録

実行後、`migrations/` 内のファイルに日付コメントを追加するか、別途管理表を作成

## 命名規則

```
{3桁連番}_{説明}.sql
```

例:
- `001_initial_schema.sql`
- `003_add_user_settings.sql`

## 注意事項

- **本番環境での実行は慎重に**: 必ず開発環境でテスト後に適用
- **ロールバック**: 必要に応じてDROPスクリプトも用意
- **RLS**: Row Level Securityのポリシーも忘れずに設定

## 最近の migration メモ

### 028_drop_disclosure_summary.sql

`disclosure_events` から `summary` / `raw_segment` を削除。kabutan 編集者由来の表現を保存しない方針への変更。`reason` / `educational_note` は Claude による公的ソース要約のため保持。

### 029_add_key_concept.sql

`stock_impact_analyses` に `key_concept VARCHAR(100)` を追加。初心者向けに「他銘柄にも応用できる読み方」を 1 行で保持する用途。

> ⚠️ 2026-06 時点の運用注意: Gemini 抽出側（`disclosure-extraction/schema.ts` / `prompt.ts`）は `keyConcept` を出力するが、`/api/admin/disclosures/import` の insert と `/api/disclosure-impact` の select に `key_concept` 列が含まれておらず、`DisclosureImpactAnalysis` / `PreviewEvent` 型にも未追加。そのため migration 適用後も UI まで届かない。実装側の追補が必要（別タスク管理）。
