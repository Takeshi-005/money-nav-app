# トラブルシューティング

よくある問題と解決方法です。

> ⚠️ **サービス終了に伴い、2026-08-18 に Cloud Run・Cloud Scheduler などの GCP リソースを削除済みです。** 本書は稼働していた頃の仕組みを学ぶ資料として残しています。経緯は [docs/shutdown/SHUTDOWN_CHECKLIST.md](../shutdown/SHUTDOWN_CHECKLIST.md) を参照してください。

---

## 💡 このガイドから学べること

- **よくあるエラー** の原因と対処法
- **デバッグ手法** の基本
- **ログの読み方**

---

## ローカル開発

### pnpm install が失敗する

**エラー**:

```
ERR_PNPM_PEER_DEP_ISSUES
```

**解決策**:

```bash
# node_modules を削除して再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

### ポート3000が使用中

**エラー**:

```
Error: listen EADDRINUSE: address already in use :::3000
```

**解決策**:

```bash
# 使用中のプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 {PID}

# または別ポートで起動
pnpm dev -p 3001
```

---

### 環境変数が読み込まれない

**症状**: `undefined` が返る

**チェックリスト**:

1. ファイル名が `.env` であること（`.env` ではない）
2. 開発サーバーを再起動
3. `NEXT_PUBLIC_` プレフィックスの確認

**📚 学習ポイント**:

```
NEXT_PUBLIC_XXX=value  → ブラウザで使える
XXX=value              → サーバーのみ
```

---

## 認証

### ログインできない

**症状**: Googleログインがエラーになる

**チェックリスト**:

1. Supabase Dashboard で Google プロバイダーが有効か
2. OAuth リダイレクトURL が正しいか
   - ローカル: `http://localhost:3000/auth/callback`
   - 本番: `https://your-domain.com/auth/callback`
3. Google Cloud Console で OAuth 同意画面が設定されているか

---

### セッションが維持されない

**症状**: リロードするとログアウトする

**原因**: Cookie の設定問題

**解決策**:

```typescript
// lib/supabase/client.ts
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return document.cookie.match(
          new RegExp("(^| )" + name + "=([^;]+)"),
        )?.[2];
      },
      set(name: string, value: string, options: CookieOptions) {
        document.cookie = `${name}=${value}; path=/; ${options.secure ? "secure;" : ""}`;
      },
      remove(name: string) {
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      },
    },
  },
);
```

---

## API

### 401 Unauthorized

**原因**: 認証トークンがない、または無効

**解決策**:

```typescript
// トークンを確認
const {
  data: { session },
} = await supabase.auth.getSession();
console.log("Token:", session?.access_token);

// APIリクエストにトークンを含める
fetch("/api/quiz", {
  headers: {
    Authorization: `Bearer ${session?.access_token}`,
  },
});
```

---

### 401 Unauthorized (CRON)

**エラー**:

```json
{ "error": "Unauthorized" }
```

**原因**: Cloud Scheduler の OIDC トークンの検証（`verifySchedulerToken`）に失敗した

**解決策**:

1. Cloud Run の環境変数 `GCP_PROJECT_ID` が設定されているか確認（Scheduler の SA のメールアドレスを組み立てるのに使う）
2. Scheduler ジョブの `oidc_token` の `service_account_email` が `api-scheduler@…` になっているか確認
3. 手動で呼ぶときは、トークンに `email` クレームが入っているか確認（`gcloud auth print-identity-token` なら `--include-email` が必要。[API リファレンス](./API.md) を参照）

Cloud Run は `allUsers` に公開しているので、Cloud Run の IAM が 403 を返すことはありません。403 が返るなら、サービスが非公開に変わっていないかを確認します。

ローカルでは、`/api/test/*` を `CRON_SECRET` で呼んで動作を確かめます。

```bash
# ローカルでテスト
curl -X POST http://localhost:3000/api/test/slack-notification \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

### 500 Internal Server Error

**解決手順**:

1. **サーバーログを確認**

   ```bash
   # ローカル
   pnpm dev  # ターミナルにエラーが表示される

   # Cloud Run
   gcloud run services logs read kabu-news-ai --region asia-northeast1
   ```

2. **よくある原因**:
   - 環境変数が未設定
   - データベース接続エラー
   - 外部API（Gemini）のエラー

---

## データベース

### Supabase 接続エラー

**エラー**:

```
Error: Invalid API key
```

**解決策**:

1. `NEXT_PUBLIC_SUPABASE_URL` が正しいか確認
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しいか確認
3. Supabase プロジェクトが起動しているか確認

---

### RLS（Row Level Security）エラー

**エラー**:

```
Error: new row violates row-level security policy
```

**原因**: RLS ポリシーがデータアクセスをブロック

**解決策**:

1. Supabase Dashboard → Table Editor → Policies を確認
2. 適切なポリシーを追加

```sql
-- 例: ユーザーが自分のデータのみ読み書きできる
CREATE POLICY "Users can read own data"
ON users FOR SELECT
USING (auth.uid() = uid);
```

---

## Vertex AI

### レート制限エラー

**エラー**:

```
Error: 429 Resource has been exhausted
```

**原因**: Gemini 2.5 Flash は動的共有クォータで、全利用者で共有する処理能力が混み合うと 429 が返る（プロジェクトごとの固定の上限を超えたわけではない）

**解決策**:

1. 指数バックオフで再試行する（本プロジェクトは `web/src/shared/api/gemini/retry.ts` の `callGeminiWithRetry` で、1秒から最大10秒まで間隔を倍にしながら再試行）
2. バッチ処理で呼び出し回数を減らす
3. `diagnosis_cache` テーブルのキャッシュを活用（同一回答パターンの再呼び出しを防ぐ）
4. それでも足りなければ、global エンドポイント（空いているリージョンに振り分けられる）や Provisioned Throughput（事前に購入する処理枠）を検討する

Quotas 画面には、Gemini 2.5 Flash の引き上げを申請できる項目がありません。

---

### JSON パースエラー

**エラー**:

```
SyntaxError: Unexpected token in JSON
```

**原因**: Gemini の出力が JSON 形式でない

**解決策**:

```typescript
// プロンプトで明示的にJSON出力を要求
const prompt = `
以下の形式のJSONのみを返してください。説明は不要です。
{
  "question": "...",
  "options": [...]
}
`;

// レスポンスのパース
const text = response.text();
const jsonMatch = text.match(/\{[\s\S]*\}/);
if (jsonMatch) {
  const data = JSON.parse(jsonMatch[0]);
}
```

---

## Docker / デプロイ

### exec format error

**エラー**:

```
exec /usr/local/bin/docker-entrypoint.sh: exec format error
```

**原因**: Mac（ARM64）でビルドしたイメージを Cloud Run（AMD64）で実行

**解決策**:

```bash
# AMD64 用にビルド
docker buildx build --platform linux/amd64 \
  -t asia-northeast1-docker.pkg.dev/PROJECT_ID/REPO/app:latest \
  --push .
```

---

### NEXT_PUBLIC 変数が反映されない

**症状**: 本番環境で環境変数が `undefined`

**原因**: `NEXT_PUBLIC_` 変数はビルド時に埋め込まれる

**解決策**:

```dockerfile
# Dockerfile
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
```

```yaml
# GitHub Actions
- name: Build and push
  uses: docker/build-push-action@v6
  with:
    build-args: |
      NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
```

---

### Cloud Run のコールドスタート

**症状**: 初回アクセスが遅い（5〜10秒）

**原因**: `min-instances = 0` の場合、アイドル時にインスタンスが停止

**解決策**:

1. 許容する（コスト削減優先）
2. `min-instances = 1` に設定（月額数百円かかる）
3. Cloud Scheduler で定期的にアクセスする（ウォームアップ）。ただし、アイドル状態のインスタンスがいつまで残るかは保証されない（目安は最大15分程度）ので確実ではない。ジョブを増やすと Scheduler の無料枠（3ジョブ）も超える

---

## デバッグ手法

### ブラウザでのデバッグ

```typescript
// コンソールログ
console.log("Debug:", variable);

// ブレークポイント
debugger;

// ネットワークタブでAPIレスポンスを確認
// DevTools → Network → Fetch/XHR
```

### サーバーでのデバッグ

```typescript
// API Route でログ出力
export async function POST(request: Request) {
  console.log("Request body:", await request.json());
  console.log("Headers:", Object.fromEntries(request.headers));
  // ...
}
```

### Cloud Run のログ

```bash
# 最新のログを確認
gcloud run services logs read kabu-news-ai \
  --region asia-northeast1 \
  --limit 100

# リアルタイムでログを監視（tail は beta コマンド）
gcloud beta run services logs tail kabu-news-ai \
  --region asia-northeast1
```

---

## 関連ドキュメント

- [ローカル開発環境](../setup/LOCAL.md) - 開発環境の構築
- [環境変数](../setup/SECRETS.md) - 環境変数の設定
- [API一覧](./API.md) - APIの仕様
