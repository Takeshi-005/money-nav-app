# glossary:update 実行タイミングガイド

`glossary:update` は Gemini API で投資用語を5〜10件自動生成し、Supabase の `glossary_terms` テーブルに upsert するスクリプト。現状は手動実行前提で、Cloud Scheduler や CI/CD には未組み込み。

## コマンド

```bash
cd web && pnpm glossary:update
```

## 仕組み

1. `glossary_terms` テーブルから既存スラッグ一覧を取得
2. Gemini API に既存スラッグを渡し、重複しない新規用語を5〜10件生成
3. 生成された用語を `glossary_terms` テーブルに upsert

### 関連ファイル

| ファイル | 役割 |
|---|---|
| `web/scripts/update-glossary.ts` | 実行スクリプト本体 |
| `web/src/lib/gemini/glossary/prompt.ts` | Gemini プロンプト定義 |
| `web/src/lib/gemini/glossary/generate.ts` | Gemini API 呼び出し |
| `web/src/lib/gemini/glossary/schema.ts` | レスポンススキーマ |
| `web/src/lib/supabase/glossary-client.ts` | Supabase CRUD |

### データの利用箇所

`generate-news-article` API がニュース記事生成時に `glossary_terms` を参照し、`linkifyKeyTerms` で記事内のキーワードを用語辞典ページへリンク化する。用語が充実しているほど記事内のリンク精度が向上する。

## 推奨実行タイミング

### 定期的な実行（推奨: 週1回程度）

- **タイミング**: ニュース記事生成 cron（毎朝7時平日）の前日夜や週末
- **理由**: 記事生成前に用語辞典を充実させることで、キーワードリンクの品質が向上する

### スポット実行

- Gemini プロンプト（`src/lib/gemini/glossary/prompt.ts`）を更新した直後
- 新しいカテゴリや難易度の用語を拡充したい時
- 初回デプロイ前の初期データ投入

## 注意点

- 1回の実行で5〜10件の用語を生成（Gemini API 無料枠: 15 RPM、1,500 req/日）
- 既存スラッグとの重複チェックはスクリプト内で自動的に行われる（upsert）
- 現在の用語数が十分と感じたら実行頻度を下げて問題ない
- 環境変数 `GCP_PROJECT_ID`、`GOOGLE_CLOUD_LOCATION`、Supabase 関連の設定が必要
