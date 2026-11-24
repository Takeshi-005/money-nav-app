# Cloud Logging 学習ガイド

初学者向けに、Cloud Loggingを使ったエラー監視の学び方を段階的に解説します。

> ⚠️ **サービス終了に伴い、2026-08-18 に Cloud Run サービス `kabu-news-ai` を削除済みです。** Cloud Logging の `_Default` バケットのログは30日で消えるため、このサービスのログも 2026-09-17 ごろまでにすべて期限切れになっています。本書の練習課題は、自分の Cloud Run サービスに置き換えて試してください。

---

## 📚 Cloud Loggingとは

Google Cloud Platformが提供するログ管理サービスです。Cloud Runで動作するNext.jsアプリケーションのログを自動収集し、検索・分析・アラート設定ができます。

### なぜ重要か

本番環境では、エラーが発生してもすぐには気づけません。Cloud Loggingを使うことで：

- **エラーの早期発見**：ユーザーが報告する前に問題を検知
- **原因の特定**：スタックトレース・リクエスト情報から根本原因を追跡
- **パフォーマンス監視**：レスポンス時間の異常を検知

---

## 🎯 4段階の学習アプローチ

初学者が確実に理解を深められるよう、実践的な4つのフェーズで学習します。

### Phase 1: コンソールでログを見る【理解度: 初級】

**目的**: Cloud Loggingの基本操作に慣れる

#### Step 1-1: ログエクスプローラーにアクセス

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 左メニュー「ロギング」→「ログ エクスプローラー」をクリック
3. リソースタイプを「Cloud Run」、サービス名を `kabu-news-ai` に絞り込み

#### Step 1-2: ログの構造を理解する

表示されるログには以下の情報が含まれます：

| フィールド | 説明 | 例 |
| --- | --- | --- |
| **タイムスタンプ** | ログが記録された時刻 | `2025-01-15 10:30:45.123 JST` |
| **重大度** | ログレベル（ERROR, WARNING, INFO） | `ERROR` |
| **リソース** | ログ発生元のサービス | `cloud-run/kabu-news-ai` |
| **jsonPayload** | 構造化されたログデータ（コンテナログ） | `{ message: "...", stack: "..." }` |
| **httpRequest** | HTTPリクエスト情報（リクエストログ） | `GET /api/quiz 500` |
| **trace** | 分散トレーシングID | `projects/.../traces/...` |

> 💡 上の表の項目が、1件のログにすべてそろうわけではありません。Cloud Run のログは大きく2種類に分かれます。
>
> - **リクエストログ**（ログ名 `run.googleapis.com/requests`）: Cloud Run が自動で記録する。`httpRequest`（URL・ステータス・レイテンシ）と `trace` を持つ
> - **コンテナログ**（標準出力・標準エラー出力）: アプリが出力したもの。テキストなら `textPayload`、1行の JSON なら `jsonPayload` に入る
>
> そのため、`httpRequest.*` で絞るクエリはリクエストログを、`jsonPayload.*` で絞るクエリはアプリのログを対象にします。

#### Step 1-3: 実際のエラーログを探す

以下のクエリをコピーして、ログエクスプローラーの検索欄に入力：

```text
resource.type="cloud_run_revision"
resource.labels.service_name="kabu-news-ai"
severity=ERROR
```

**練習課題**:

- [ ] 最新のERRORログを1件見つける
- [ ] そのログの `jsonPayload.message` に何が書かれているか確認
- [ ] タイムスタンプから、何時にエラーが発生したか記録

---

### Phase 2: フィルタリングを学ぶ【理解度: 中級】

**目的**: 必要なログだけを効率的に抽出する

#### Step 2-1: 重大度でフィルタリング

ログレベルの意味を理解しましょう：

| 重大度 | 使いどころ | 例 |
| --- | --- | --- |
| **ERROR** | エラーが発生し、処理が失敗した | データベース接続失敗 |
| **WARNING** | 異常だが処理は継続できる | レスポンスが3秒以上 |
| **INFO** | 正常な動作ログ | APIリクエスト受信 |
| **DEBUG** | 開発時のデバッグ情報 | 変数の値 |

**クエリ例**: エラーと警告のみ表示

```text
resource.type="cloud_run_revision"
resource.labels.service_name="kabu-news-ai"
(severity=ERROR OR severity=WARNING)
```

#### Step 2-2: 特定のエンドポイントのログを絞り込む

**クエリ例**: `/api/quiz` のエラーのみ

```text
resource.type="cloud_run_revision"
resource.labels.service_name="kabu-news-ai"
httpRequest.requestUrl=~"/api/quiz"
severity=ERROR
```

`=~` は「部分一致」を意味します（正規表現）。

#### Step 2-3: 時間範囲を指定

右上の「日時」から、以下のように絞り込めます：

- 直近1時間
- 過去24時間
- カスタム範囲（例: 昨日の10時〜12時）

#### Step 2-4: パフォーマンス監視のクエリ

**クエリ例**: 3秒以上かかったリクエスト

```text
resource.type="cloud_run_revision"
resource.labels.service_name="kabu-news-ai"
httpRequest.latency>"3s"
```

**練習課題**:

- [ ] 過去24時間のERRORログを表示
- [ ] `/api/predictions` のWARNINGログを検索
- [ ] 特定の日時のログを時間指定で探す
- [ ] レスポンスが5秒以上かかったリクエストを検索

---

### Phase 3: アラート設定【理解度: 中上級】

**目的**: エラーを自動検知してSlack通知する

#### Step 3-1: アラートの2つの方式を理解する

ログをきっかけにしたアラートには、2つの方式があります。

| 方式 | 通知される条件 | 向いている用途 |
| --- | --- | --- |
| **ログベースのアラート** | 該当するログが**1件でも**出たら | 起きたら必ず知りたい事象（例: 定時処理の失敗） |
| **ログベースの指標 + 指標のアラート** | 一定時間内の件数が**しきい値を超えたら**（例: 5分間に5件以上） | 頻度で判断したい事象（例: ERROR の急増） |

ログベースのアラートは件数を数えられません。「5分間に5回以上」のような条件を付けたいときは、指標の方式を使います。

#### Step 3-2: ログベースのアラートを作成（1件で通知）

1. ログエクスプローラーで以下のクエリを実行

   ```text
   resource.type="cloud_run_revision"
   resource.labels.service_name="kabu-news-ai"
   severity=ERROR
   ```

2. 「アクション（Actions）」メニューから「ログアラートを作成（Create log alert）」を選ぶ

3. 以下の設定を行う：
   - **アラート ポリシー名**: `Cloud Run エラー検知`
   - **通知の最小間隔**: `5分`（条件が続けて満たされても、この間隔より頻繁には通知しない）
   - **通知チャネル**: Slack（Step 3-4 で作成）

#### Step 3-3: 件数でアラートを出す（ログベースの指標）

1. ログエクスプローラーで同じクエリを実行し、「アクション（Actions）」メニューから「指標を作成（Create metric）」を選ぶ
2. 指標タイプを「カウンタ」にし、名前（例: `cloud_run_error_count`）を付けて作成する
3. Cloud Monitoring の「アラート」で、作成した指標を条件にアラート ポリシーを作る
   - **しきい値**: 5分間の合計が5件以上
   - **通知チャネル**: Slack（Step 3-4 で作成）

> **⚠️ アラート疲れ（Alert Fatigue）を防ぐために**:
> しきい値は最初は厳しく設定し、誤検知が多い場合は緩和します。頻繁すぎる通知は無視されるようになるため、本当に重要なエラーのみ通知するよう調整しましょう。

#### Step 3-4: Slack通知の設定

1. Cloud Monitoring の「アラート」→「通知チャネルを編集」を開く
2. 「Slack」の「新しく追加」をクリックし、Slack の画面でワークスペースを選んで連携を許可する
3. 通知先のチャンネルを指定して保存する（非公開チャンネルなら、Slack 側で `/invite @Google Cloud Monitoring` を実行しておく）

> **⚠️ Webhook チャネルは使わない**: 「Webhook」チャネルに Slack の Incoming Webhook URL（`https://hooks.slack.com/services/...`）を入れても動きません。Webhook チャネルは Cloud Monitoring 独自の JSON 形式で送るため、Slack がその形式を受け付けないからです。Slack には Slack 専用のチャネルを使います。

#### Step 3-5: アラートをテストする

意図的にエラーログを出してアラートが届くか確認：

```typescript
// web/src/app/api/test-error/route.ts
import { logger } from '@/shared/lib/logger'

export async function GET() {
  logger.error('アラートテスト用エラー')
  return Response.json({ error: 'test' }, { status: 500 })
}
```

JSON にしないテキスト（`console.error('...')`）では重大度 ERROR が確実には付かないため、構造化ログを出す `logger` を使います。

`/api/test-error` にアクセスして、Slackに通知が来るか確認します。ログベースのアラート（Step 3-2）なら1回で届き、指標のアラート（Step 3-3）ならしきい値の回数だけアクセスが必要です。

> **重要**: テスト後は必ず `/api/test-error` を削除するか、本番環境では無効化してください。

**練習課題**:

- [ ] エラーアラートを作成し、テストする
- [ ] 警告ログが10分間に10回以上発生した場合のアラートを、ログベースの指標で追加
- [ ] アラート通知を受信したら、ログエクスプローラーで詳細を確認
- [ ] アラートのしきい値を調整して誤検知を減らす

---

### Phase 4: カスタムログの実装【理解度: 上級】

**目的**: アプリケーションから構造化ログを出力する

#### Step 4-1: 構造化ログの出力

本プロジェクトでは、構造化ログを出力するヘルパーが `web/src/shared/lib/logger.ts` に実装済みです。中心部分は次のとおりです（実際の実装はエラー分類なども持つ。使い方は [ロギングベストプラクティス](./LOGGING_BEST_PRACTICES.md) を参照）。

```typescript
// web/src/shared/lib/logger.ts（抜粋）
type LogLevel = 'INFO' | 'WARNING' | 'ERROR'

interface StructuredLog {
  severity: LogLevel
  message: string
  context?: Record<string, unknown>
  timestamp?: string
}

export function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const logData: StructuredLog = {
    severity: level,
    message,
    timestamp: new Date().toISOString(),
    ...(context && { context }),
  }

  // 重大度は JSON の severity フィールドで決まる（console のメソッドでは決まらない）
  if (level === 'ERROR') {
    console.error(JSON.stringify(logData))
  } else if (level === 'WARNING') {
    console.warn(JSON.stringify(logData))
  } else {
    console.log(JSON.stringify(logData))
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => log('INFO', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('WARNING', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('ERROR', message, context),
}
```

> **重要な技術的詳細**:
>
> - 1行の JSON 文字列として出力すると、Cloud Logging はそれを構造化データ（`jsonPayload`）として解釈します
> - 重大度は **JSON の `severity` フィールド**で決まります。`severity` は `jsonPayload` から取り除かれ、ログエントリの重大度になります
> - `console.error()` と `console.warn()` はどちらも標準エラー出力に書くため、Cloud Logging はこの2つを区別できません。console のメソッドの使い分けで重大度が決まるわけではありません
> - `message` フィールドは、ログ一覧に表示される本文として使われます

#### Step 4-2: API Routeでの実装例

```typescript
// web/src/app/api/quiz/route.ts（説明用の例）
import { logger } from '@/shared/lib/logger'

export async function GET(request: Request) {
  const startTime = Date.now()
  try {
    logger.info('クイズデータ取得開始', {
      url: request.url,
      method: request.method,
    })

    const quizzes = await fetchQuizzes()

    logger.info('クイズデータ取得成功', {
      count: quizzes.length,
      responseTime: Date.now() - startTime,
    })

    return Response.json({ data: quizzes })

  } catch (error) {
    logger.error('クイズデータ取得失敗', {
      error: error instanceof Error ? error.message : 'Unknown error',
      // スタックトレースはログの量を抑えるため先頭5行に絞る
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
    })
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

> **🔒 セキュリティベストプラクティス**:
>
> ログに含めてはいけない情報：
>
> - APIキー、トークン、パスワード
> - ユーザーの個人情報（メールアドレス、氏名）
> - クレジットカード情報
> - セッションID、JWT
>
> スタックトレースを先頭5行に絞るのは、主にログの量を抑えるためです。Node.js のスタックトレースに含まれるのはエラーメッセージと呼び出し元の関数名・ファイル位置で、環境変数は含まれません。機密が混ざる危険があるのは1行目のエラーメッセージ（接続文字列を含むエラーなど）で、5行に絞っても残ります。外部ライブラリのエラーをそのまま記録するときは、メッセージの中身にも注意しましょう。

#### Step 4-3: ローカル開発環境での確認

デプロイ前にローカルでログ出力を確認：

```bash
# Next.js開発サーバー起動
cd web && pnpm dev

# 別のターミナルでAPIにアクセス
curl http://localhost:3000/api/quiz
```

ターミナルに以下のような構造化ログが表示されます：

```json
{"severity":"INFO","message":"クイズデータ取得開始","timestamp":"2025-01-15T10:30:45.123Z","context":{"url":"http://localhost:3000/api/quiz","method":"GET"}}
```

#### Step 4-4: Cloud Loggingで確認

デプロイ後、以下のクエリで構造化ログを確認：

```text
resource.type="cloud_run_revision"
resource.labels.service_name="kabu-news-ai"
jsonPayload.message=~"クイズデータ取得"
```

`jsonPayload.context.count` などでフィルタリングも可能になります。

**練習課題**:

- [ ] logger ヘルパーを実装
- [ ] ローカル環境でログ出力を確認
- [ ] 既存のAPI Routeに構造化ログを追加
- [ ] デプロイ後、ログエクスプローラーで `jsonPayload.context` の値を確認
- [ ] エラー発生時のスタックトレースがログに含まれているか検証
- [ ] ログに機密情報が含まれていないか確認

---

## 🛠️ 実践的な監視戦略

### 監視すべきログパターン

| パターン | クエリ | アラート条件 | 理由 |
| --- | --- | --- | --- |
| **データベースエラー** | `jsonPayload.message=~"Supabase" severity=ERROR` | 5分間に3回以上 | データ取得失敗はユーザー体験に直結 |
| **API遅延** | `httpRequest.latency>"5s"` | 5分間に5回以上 | パフォーマンス劣化の兆候 |
| **認証エラー** | `httpRequest.status=401` | 10分間に20回以上 | 攻撃の可能性 |
| **500エラー** | `httpRequest.status>=500` | 5分間に3回以上 | サーバー側の異常 |

> ⚠️ 「5分間に3回以上」のような件数の条件は、ログベースの指標を作り、指標のアラートで設定します（Step 3-3）。ログベースのアラートでは件数を数えられません。

> **しきい値設定のベストプラクティス**:
>
> - 最初は厳しめ（頻度高め）に設定
> - 誤検知が多い場合は緩和
> - ビジネス影響度に応じて優先度を調整

### 週次レビューの習慣

毎週月曜の朝に、以下を確認する習慣をつけましょう：

1. **先週のERRORログを集計**

   ```text
   resource.type="cloud_run_revision"
   resource.labels.service_name="kabu-news-ai"
   severity=ERROR
   timestamp>="2025-01-13T00:00:00Z"
   timestamp<"2025-01-20T00:00:00Z"
   ```

2. **頻発するエラーTOP3を特定**
   - ログエクスプローラーは集計（件数のカウントやグループ化）に対応していないため、Log Analytics（Observability Analytics）の SQL を使う（ログバケットで Log Analytics を有効にしておく必要がある）
   - SQL では列名が `json_payload` になり、`JSON_VALUE()` で値を取り出す

     ```sql
     SELECT JSON_VALUE(json_payload.message) AS message, COUNT(*) AS count
     FROM `PROJECT_ID.LOCATION.BUCKET_ID.LOG_VIEW_ID`
     WHERE severity = 'ERROR'
     GROUP BY message
     ORDER BY count DESC
     LIMIT 3
     ```

   - または Error Reporting を使う。Cloud Run のログに含まれる例外は自動で集められ、種類ごとにまとめて表示される

3. **対策の優先順位付け**
   - 頻度が高い
   - ユーザー影響が大きい
   - 修正が容易

4. **改善サイクル**
   - エラーを修正 → デプロイ → 次週のログで効果を確認

---

## 🎓 学習の振り返りチェックリスト

すべてチェックできたら、Cloud Logging監視の基礎が身についています。

### Phase 1: 基本操作

- [ ] ログエクスプローラーにアクセスできる
- [ ] ERRORログを1件見つけて内容を理解できる
- [ ] タイムスタンプからエラー発生時刻を特定できる

### Phase 2: フィルタリング

- [ ] 重大度でフィルタリングできる
- [ ] 特定のエンドポイントのログを絞り込める
- [ ] 時間範囲を指定してログを検索できる
- [ ] パフォーマンス問題を検索できる

### Phase 3: アラート設定

- [ ] ログベースのアラートを作成できる
- [ ] Slack通知を設定できる
- [ ] テストエラーでアラートが届くか確認できる
- [ ] アラート疲れを防ぐためのしきい値調整ができる

### Phase 4: カスタムログ実装

- [ ] 構造化ログヘルパーを実装できる
- [ ] ローカル環境でログを確認できる
- [ ] API Routeでloggerを使える
- [ ] ログエクスプローラーでcontextを確認できる
- [ ] 機密情報をログに含めないようにできる

---

## 🔗 参考リンク

- [Cloud Logging公式ドキュメント](https://cloud.google.com/logging/docs)
- [ログクエリ言語リファレンス](https://cloud.google.com/logging/docs/view/logging-query-language)
- [アラート作成ガイド](https://cloud.google.com/logging/docs/alerting)
- [構造化ログのベストプラクティス](https://cloud.google.com/logging/docs/structured-logging)

---

## 次のステップ

Cloud Loggingの基礎を習得したら、以下の高度なトピックに挑戦しましょう：

1. **ログベースの指標作成**：エラー率・レイテンシをダッシュボード化
2. **Cloud Trace統合**：リクエストの分散トレーシング
3. **BigQueryエクスポート**：長期的なログ分析
4. **Error Reporting統合**：エラーの自動グループ化と通知

詳細は [GCP設定ガイド](../setup/GCP.md) および [トラブルシューティング](../reference/TROUBLESHOOTING.md) を参照してください。
