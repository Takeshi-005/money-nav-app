# [LEGACY] 初期設計ドキュメント（2026-01時点）

> **このファイルはレガシーです。** kabu-news-ai プロジェクトの **着工初期** に書かれた設計ドキュメント（n8n + Google Sheets + NewsAPI 構想時）で、現在のアーキテクチャ（Next.js + Cloud Run + Supabase + Vertex AI + FSD）とは大きく異なります。
>
> **現在の正しいリファレンスは リポジトリルートの `CLAUDE.md` を参照してください。**
>
> - 移動元: `~/CLAUDE.md`（ホーム直下、git管理外）
> - 移動日: 2026-06-05
> - 移動理由: ホーム配下の git 管理外ファイルを整理する際の履歴保全
> - 主な乖離点:
>   - 当初: n8n (Docker) + Google Sheets + NewsAPI + GCS
>   - 現在: Next.js 16 + React 19 + Supabase + Vertex AI (Gemini 2.5 Flash) + FSD アーキテクチャ
>   - 当初: Slack通知に判定理由を含めるだけのシンプル設計
>   - 現在: AI解説記事・診断・クイズ・週間レビューなど学習支援機能まで拡張

---

# CLAUDE.md

## プロジェクト概要

日本株のニュースを毎日取得し、AIで株価への影響を判定してSlackに通知するシステム。

## 技術スタック

- **ワークフロー**: n8n (Docker)
- **インフラ**: Google Cloud (Cloud Run, Cloud Scheduler, GCS)
- **AI判定**: Google AI Studio (Gemini API) - 無料枠利用
- **銘柄管理**: Google Sheets
- **ニュース取得**: NewsAPI.org または Google News RSS
- **通知**: Slack Webhook
- **IaC**: Terraform

## アーキテクチャ
```
Cloud Scheduler (毎日10時JST)
    │
    ▼
Cloud Run (n8n)
    ├── Google Sheets → 銘柄リスト取得
    ├── News API → ニュース取得
    ├── Gemini API → 影響判定
    ├── GCS → 履歴保存
    └── Slack → 通知送信
```

## ディレクトリ構成
```
stock-news-notifier/
├── CLAUDE.md
├── README.md
├── .gitignore
├── .github/
│   └── workflows/
│       └── deploy.yml
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml      # ローカル開発用
├── n8n/
│   └── workflows/
│       └── stock-news-workflow.json
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── cloud-run.tf
│   ├── cloud-scheduler.tf
│   ├── gcs.tf
│   └── iam.tf
└── docs/
    ├── SETUP.md
    └── SPREADSHEET_TEMPLATE.md
```

## 開発フェーズ

### Phase 1: ローカル開発環境構築
- [ ] Docker Composeでn8nをローカル起動
- [ ] Google Sheets API連携設定
- [ ] Gemini API連携設定
- [ ] Slack Webhook設定
- [ ] n8nワークフロー作成・動作確認

### Phase 2: インフラ構築 (Terraform)
- [ ] GCSバケット作成（履歴保存用）
- [ ] Cloud Run設定（n8n用）
- [ ] Cloud Scheduler設定（毎日10時JST）
- [ ] IAM設定

### Phase 3: CI/CD構築
- [ ] GitHub Actionsでデプロイ自動化
- [ ] Terraform plan/applyの自動化

### Phase 4: 運用改善
- [ ] エラー通知（Slack）
- [ ] リトライ処理
- [ ] 実行ログの可視化

## 制約・要件

### コスト制約
- Cloud Run: 無料枠内（月200万リクエスト、CPU/メモリ無料枠）
- GCS: 無料枠内（5GB）
- Gemini API: 無料枠内（15 RPM、1,500 req/日）
- Cloud Scheduler: 無料枠内（月3ジョブ）

### 機能要件
- 監視銘柄: 10銘柄程度
- 実行頻度: 毎日10時（JST）
- 銘柄管理: Google Sheetsで有効/無効を切り替え可能
- 通知内容: 銘柄名 + ニュース見出し + AI判定（ポジティブ/ネガティブ/中立）+ 判定理由

### Google Sheets構成
| 列名 | 型 | 説明 |
|------|-----|------|
| stock_code | string | 銘柄コード（例: 7203） |
| stock_name | string | 銘柄名（例: トヨタ自動車） |
| enabled | boolean | TRUE=監視対象、FALSE=除外 |
| added_at | date | 追加日 |
| memo | string | メモ（任意） |

## AI判定プロンプト（参考）
```
以下のニュースが株価に与える影響を判定してください。

銘柄: {stock_name} ({stock_code})
ニュース: {news_headline}

以下のJSON形式で回答してください:
{
  "judgment": "positive" | "negative" | "neutral",
  "confidence": 0.0-1.0,
  "reason": "判定理由（50文字以内）"
}
```

## Slack通知フォーマット（参考）
```
📈 株価影響ニュース通知

🟢 トヨタ自動車 (7203)
見出し: トヨタ、EV新型車を発表
判定: ポジティブ
理由: 新製品発表は株価にプラス材料

🔴 ソニーG (6758)
見出し: 半導体不足で生産調整
判定: ネガティブ
理由: 生産減少は業績悪化懸念

---
実行日時: 2025-01-06 10:00 JST
```

## 環境変数
```env
# Google Cloud
GCP_PROJECT_ID=your-project-id
GCP_REGION=asia-northeast1

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Google Sheets
GOOGLE_SHEETS_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_JSON=path/to/service-account.json

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx

# News API (NewsAPI.orgを使用する場合)
NEWS_API_KEY=your-news-api-key
```

## 開発コマンド
```bash
# ローカルでn8n起動
cd docker && docker-compose up -d

# Terraform初期化
cd terraform && terraform init

# インフラ確認
terraform plan

# インフラ適用
terraform apply
```

## 注意事項

- Gemini APIの無料枠は15 RPM（1分間15リクエスト）なので、10銘柄×複数ニュースでもレート制限に注意
- Cloud Runは最小インスタンス0で設定し、起動時間を許容する（コスト削減）
- 日本株ニュースは日本語検索が必要なため、NewsAPIの言語設定に注意
