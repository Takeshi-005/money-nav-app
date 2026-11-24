# 仕様書

AI投資パートナーの画面別仕様書です。新規画面追加時は [`screens/_TEMPLATE.md`](./screens/_TEMPLATE.md) をコピーして作成してください。

---

## 📐 画面別仕様書

ステータス凡例: 🟢 Approved / 🟡 Review / ⚪ Draft

| 画面 | URL | ステータス | 最終更新 | 仕様書 |
|------|-----|----------|---------|--------|
| ニュース解説記事 詳細ページ | `/news-articles/[date]` | 🟢 Approved | 2026-05-17 | [news-article-detail.md](./screens/news-article-detail.md) |

> 今後追加予定: ホーム / ニュース解説一覧 / 投資スタイル診断 / デイリークイズ / 市場解説 / 投資家ガイド / 週間レビュー / ダッシュボード / 管理画面

---

## 📝 テンプレート

新規画面の仕様書を作成する際は、以下のテンプレートをコピーして使用してください。

- [`screens/_TEMPLATE.md`](./screens/_TEMPLATE.md)

### 含まれるセクション（MVP）

1. YAMLメタ情報（screen_id / last_updated / status / owner）
2. 概要（画面の目的・提供価値）
3. 対象ユーザー / 利用シーン
4. 基本情報（URL / アクセス権限 / キャッシュ / 動的パラメータ）
5. スクリーンショット
6. 画面遷移図（Mermaid `stateDiagram-v2`）
7. 画面構成（セクション順テーブル）
8. データソース（テーブル / API）
9. データ生成タイミング
10. ユーザー操作と遷移
11. SEO / 構造化データ
12. エラーハンドリング
13. 関連ファイル（FSDレイヤー別ツリー）
14. 関連ドキュメント

> 後続フェーズで「受け入れ基準」「テスト観点」「非機能要件（パフォーマンス・a11y）」セクションを追加検討予定。

---

## 📋 命名規則

- ファイル名: `{画面名 kebab-case}.md`
  - 例: `news-article-detail.md`, `diagnosis-result.md`, `admin-watched-stocks.md`
- スクリーンショット: `screens/images/{画面名}.png`
- `screen_id` はファイル名（拡張子除く）と一致させる

---

## 🔄 更新ルール

1. **内容を変更したら必ず `last_updated` を更新**（YAMLメタ情報）
2. **ステータス遷移**:
   - `Draft`: 作成中・未レビュー
   - `Review`: レビュー待ち・コメント受付中
   - `Approved`: 関係者承認済み・公式仕様
3. **画面のUI/機能が変わったら24時間以内に仕様書も更新**（コードと仕様書の乖離を防ぐ）
4. **スクリーンショットの更新**: UI変更時は `playwright-cli` で本番URLを再撮影
   ```bash
   playwright-cli open https://money-nav.com/{path}
   playwright-cli resize 1280 800
   playwright-cli run-code "async page => await page.screenshot({ path: 'docs/specifications/screens/images/{name}.png', fullPage: true, type: 'png' })"
   ```

---

## 関連ドキュメント

- [ドキュメント目次](../README.md)
- [フロントエンドアーキテクチャ](../architecture/FRONTEND_ARCHITECTURE.md)
- [ユーザージャーニー](../business/USER_JOURNEY.md)
- [機能詳細](../business/FEATURES.md)
