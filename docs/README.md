# ドキュメント

AI投資パートナーの技術ドキュメント一覧です。

---

## 🏗️ アーキテクチャ

システム構成と設計に関するドキュメント。

| ドキュメント                                                            | 概要                                   |
| ----------------------------------------------------------------------- | -------------------------------------- |
| [システム構成](./architecture/OVERVIEW.md)                              | Cloud Run + Next.js のシステム全体構成 |
| [データベース設計](./architecture/DATABASE.md)                          | Supabase/Firestore のスキーマ定義      |
| [フロントエンドアーキテクチャ](./architecture/FRONTEND_ARCHITECTURE.md) | Feature-Sliced Design (FSD) の構成     |

---

## 📐 仕様書

画面別仕様書とテンプレート。

| ドキュメント                                  | 概要                                                |
| --------------------------------------------- | --------------------------------------------------- |
| [仕様書一覧](./specifications/README.md)      | 画面別仕様書の目次・テンプレート・命名規則・更新ルール |

---

## 🚀 セットアップ

開発環境の構築手順。

| ドキュメント                         | 概要                                |
| ------------------------------------ | ----------------------------------- |
| [ローカル開発環境](./setup/LOCAL.md) | pnpm, Next.js の開発環境構築        |
| [GCP設定](./setup/GCP.md)            | Google Cloud プロジェクトの初期設定 |
| [環境変数](./setup/SECRETS.md)       | 必要な環境変数・シークレット一覧    |

---

## 💻 開発ガイド

機能開発時の参考資料。

| ドキュメント                                                          | 概要                                           |
| --------------------------------------------------------------------- | ---------------------------------------------- |
| [Next.js開発](./development/WEB.md)                                   | コンポーネント設計、API Route の実装           |
| [テストガイド](./development/TESTING.md)                              | ユニットテスト戦略、カバレッジ目標、実行方法   |
| [SEO最適化](./development/SEO.md)                                     | Metadata実装、構造化データ、検証方法           |
| [SEO経過観察](./development/SEO_MONITORING.md)                        | SEO改修効果の計測手順・週次/月次運用ルーティン |
| [SEO改善ログ](./development/SEO_IMPROVEMENT_LOG.md)                   | 2026-06 実施の Phase 0/1/2 改善内容と効果スナップショット |
| [LLMOps](./development/LLMOPS.md)                                     | クイズAI品質管理：3層ガードレール・Judge・リトライ |
| [Cloud Logging](./development/CLOUD_LOGGING.md)                       | エラー監視の学習ガイド（初学者向け）           |
| [ロギングベストプラクティス](./development/LOGGING_BEST_PRACTICES.md) | logger.ts の使い方、module命名規則、エラー分類 |
| [Terraform学習ガイド](./development/TERRAFORM_LEARNING.md)            | 初学者向け：「なぜこの構成か」をWHY中心で解説（Terraform/GCP基礎） |
| [GCPシステム学習ガイド](./development/GCP_SYSTEM_LEARNING.md)         | 初学者向け：定義されたインフラが実行時にどう動くかを3つの流れで解説 |
| [GCP 対談](./development/GCP_DIALOGUE.html)                           | 初級者と上級者の会話形式でGCP構成と撤収手順を解説（HTML・ブラウザで開く） |
| [Terraformリファレンス](./development/TERRAFORM.md)                   | インフラ変更の手順・コマンド逆引き             |
| [用語辞典更新](./development/GLOSSARY_UPDATE.md)                       | glossary:update の実行タイミングガイド          |

---

## 📦 デプロイ

本番環境へのデプロイ手順。

| ドキュメント                                  | 概要                                                      |
| --------------------------------------------- | --------------------------------------------------------- |
| [CI/CD](./deployment/CICD.md)                 | GitHub Actions による自動デプロイ                         |
| [IaC設計レビュー](./deployment/IAC_REVIEW.md) | Terraform & GitHub Actions の設計評価とベストプラクティス |

---

## 📚 リファレンス

APIやトラブルシューティングの参照資料。

| ドキュメント                                             | 概要                                  |
| -------------------------------------------------------- | ------------------------------------- |
| [API一覧](./reference/API.md)                            | REST API エンドポイント仕様           |
| [UIコンポーネント](./reference/UI_COMPONENTS.md)         | 汎用UIコンポーネント API リファレンス |
| [トラブルシューティング](./reference/TROUBLESHOOTING.md) | よくある問題と解決方法                |

---

## 📊 ビジネス

コンサル・マーケター向けの資料。

| ドキュメント                                         | 概要                             |
| ---------------------------------------------------- | -------------------------------- |
| [ビジネスドキュメント一覧](./business/README.md)     | 目次・読者別ガイド               |
| [プロダクト概要](./business/PRODUCT_OVERVIEW.md)     | ミッション・コンセプト・提供価値 |
| [機能詳細](./business/FEATURES.md)                   | 3つの主要機能の詳細説明          |
| [ユーザージャーニー](./business/USER_JOURNEY.md)     | 体験フロー・画面遷移             |
| [ターゲットペルソナ](./business/TARGET_PERSONA.md)   | ユーザー像・ニーズ・課題         |
| [競合分析](./business/COMPETITIVE_ANALYSIS.md)       | 競合比較・SWOT・差別化           |
| [マーケティング素材](./business/MARKETING_ASSETS.md) | コピー・SNS素材・広告文言        |
| [KPI・指標](./business/METRICS.md)                   | 追跡すべき成功指標               |

---

## 🔍 Issues

解決済みの問題・設計上の意思決定の記録。

| ドキュメント                                                            | 概要                                               |
| ----------------------------------------------------------------------- | -------------------------------------------------- |
| [Issues 一覧](./issues/README.md)                                       | 解決済み issue の目次                              |
| [Cloud Scheduler OIDC 移行](./issues/CLOUD_SCHEDULER_OIDC_MIGRATION.md) | tfstate へのシークレット平文漏洩を OIDC 認証で解消（古い state に残っていた平文は 2026-09-24 に削除） |

---

## クイックリンク

- [README.md](../README.md) - プロジェクト概要
- [CLAUDE.md](../CLAUDE.md) - 開発者向けクイックリファレンス
