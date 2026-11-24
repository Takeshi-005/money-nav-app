# Google Cloud システム学習ガイド — このリポジトリで何がどう動いているか

## はじめに

### このドキュメントの目的

本プロジェクトで実際に使われている Google Cloud (GCP) のサービス群が、
**実行時にどう動き、どう連携しているか** を初学者向けに解説します。

姉妹ドキュメントの [Terraform 学習ガイド](./TERRAFORM_LEARNING.md) が
「インフラを**コードでどう定義するか**（IaC・Terraformの書き方とWHY）」を扱うのに対し、
本ドキュメントは「定義されたインフラが**実際にどう動くか**（GCPサービスの仕組み）」を扱います。

> ⚠️ **サービス終了に伴い、2026-08-18 に本書で扱う GCP リソース（Cloud Run・Scheduler・Secret・SA・Workload Identity など）を削除済みです。** 本書は稼働していた頃の仕組みを学ぶ資料として残しています。Terraform の定義はリポジトリに残っているため、`terraform apply` すると作り直しが始まる点に注意してください（新しく作られる Artifact Registry は空でイメージがないため、Cloud Run の作成で失敗し、途中まで作られた状態で止まります）。経緯は [docs/shutdown/SHUTDOWN_CHECKLIST.md](../shutdown/SHUTDOWN_CHECKLIST.md) を参照してください。

### 想定読者

- インフラ・クラウドの初学者
- 「Cloud Run って何？」「サービスアカウントって誰？」というレベルからでOK
- Web アプリ（Next.js）側の開発経験はある程度ある人

### 読み方

GCP のサービスを1つずつ暗記するのではなく、このシステムで起きる **3つの「流れ」** を追いかけます。
流れの中で各サービスが登場するので、役割が自然に頭に入ります。

| 流れ | 登場するGCPサービス |
| ---- | ------------------- |
| ① ユーザーのリクエストが処理されるまで | Cloud Run, Secret Manager, Vertex AI |
| ② コードが本番に届くまで（デプロイ） | Workload Identity Federation, Artifact Registry, Cloud Run |
| ③ 毎朝9時にバッチが動くまで | Cloud Scheduler, IAM (OIDC) |

---

## Part 0: 全体地図

まず全体像です。この図に出てくる登場人物を、以降のPartで1つずつ解説します。

```
                        【② デプロイの流れ】
  GitHub Actions ──WIFでキーレス認証──▶ Artifact Registry
       │                                （Dockerイメージ置き場）
       └──deploy-cloudrun──────────────────────┐
                                               ▼
【① リクエストの流れ】                  ┌─────────────────┐
  ユーザーのブラウザ ──HTTPS──────────▶ │    Cloud Run     │──▶ Vertex AI
                                        │  (Next.js app)   │    (Gemini)
【③ バッチの流れ】                      │                  │──▶ Supabase
  Cloud Scheduler ──OIDCトークン付き──▶ │  0〜2インスタンス │    (DB・GCP外)
  (毎日9時など)      POSTリクエスト     └────────┬─────────┘
                                                │ 起動時に読み込み
                                                ▼
                                         Secret Manager
                                         (APIキー等の金庫)
```

登場するサービスの一言サマリー:

| サービス | 一言でいうと | 定義ファイル |
| -------- | ------------ | ------------ |
| Cloud Run | コンテナを「リクエストが来たときだけ」動かすサーバーレス実行環境 | `terraform/cloud-run.tf` |
| Artifact Registry | Dockerイメージの保管庫（プライベートなDocker Hub） | `terraform/cloud-run.tf` |
| Secret Manager | APIキーなど秘密情報の金庫 | `terraform/secrets.tf` |
| Cloud Scheduler | クラウド版cron。決まった時刻にHTTPリクエストを撃つ | `terraform/cloud-scheduler.tf` |
| IAM / サービスアカウント | 「誰が・何を・していいか」の権限管理 | `terraform/iam.tf` |
| Workload Identity Federation | GitHub Actions がパスワードなしでGCPに入るための身元保証の仕組み | `terraform/workload-identity.tf` |
| Vertex AI | Gemini などのAIモデルをAPIとして使うサービス | （アプリコードから利用） |

---

## Part 1: リクエストの流れ — Cloud Run がアプリを動かす仕組み

### 1.1 Cloud Run とは — 「サーバーを持たない」という選択

従来のWebサーバー運用では、24時間動き続ける仮想マシン（VM）を借りて、
その上にアプリを置いていました。アクセスがゼロの深夜でもサーバー代はかかります。

Cloud Run は **サーバーレス** と呼ばれる方式で、発想が逆です。

- アプリを **コンテナ**（アプリ＋実行環境一式をパッケージ化したもの）として登録しておく
- リクエストが来たら、GCPがコンテナを起動して処理させる
- リクエストが来なくなったら、しばらく（最大15分ほど）アイドルで待機してからコンテナを停止する（→ **課金もゼロに近づく**。既定の課金方式ではアイドル中は課金されない）

本プロジェクトの設定を見てみましょう:

```hcl
# terraform/cloud-run.tf:32-35
scaling {
  min_instance_count = 0
  max_instance_count = 2
}
```

- `min_instance_count = 0`: アクセスがなければインスタンス（動いているコンテナ）は **0台**。費用もほぼゼロ
- `max_instance_count = 2`: アクセスが急増しても最大2台まで。1台あたり同時80リクエスト（1 vCPU の場合）なので同時に処理できるのは最大160件で、超えた分はしばらく待たされた後 429 エラーになる。AI API の呼び出しが一気に膨らむのを抑えるブレーキになるが、**請求総額の上限ではない**（総額は予算アラートや API のクォータで抑える）

### 1.2 コールドスタート — サーバーレスの代償

0台から1台に起動する瞬間、コンテナの起動時間ぶんだけ最初のレスポンスが遅れます。
これを **コールドスタート** と呼び、サーバーレスの代表的な弱点です。

本プロジェクトはこれを2つの設定で緩和しています:

```hcl
# terraform/cloud-run.tf:44-51
resources {
  limits = {
    cpu    = "1"
    memory = "512Mi"
  }
  cpu_idle          = true # CPUを常時割り当てない（コスト削減）
  startup_cpu_boost = true # 起動時のみCPUブースト
}
```

- `startup_cpu_boost = true`: 起動の瞬間だけCPUを増強し、コールドスタートを短縮
- `cpu_idle = true`: リクエスト処理中（と起動・停止時）以外はCPUを割り当てない。「リクエスト課金」モードになり、アイドル中は課金されないので安価

### 1.3 ヘルスチェック — 「壊れたコンテナに客を通さない」

Cloud Run は起動したコンテナが正常かどうかを、アプリの `/api/health` を叩いて確認します。

```hcl
# terraform/cloud-run.tf:53-72（抜粋）
startup_probe {
  http_get {
    path = "/api/health"
    ...
  }
}
liveness_probe {
  http_get {
    path = "/api/health"
    ...
  }
}
```

2種類あるのがポイントです:

| プローブ | いつ確認するか | 失敗するとどうなるか |
| -------- | -------------- | -------------------- |
| `startup_probe` | 起動直後 | 「まだ準備中」とみなしトラフィックを流さない。失敗し続けると起動失敗扱い |
| `liveness_probe` | startup の成功後ずっと（30秒ごと） | 失敗が続くとコンテナを異常とみなして停止し、新しいインスタンスに置き換える |

### 1.4 「全公開」と「アプリ層での認証」の分担

```hcl
# terraform/cloud-run.tf:178-184
resource "google_cloud_run_v2_service_iam_member" "public" {
  ...
  role   = "roles/run.invoker"
  member = "allUsers"
}
```

`allUsers` は「インターネット上の全員」を意味します。つまり **Cloud Run 自体は誰でもアクセス可能** です。
Webサイトなので当然ですが、ではAPIの保護はどうするのか？

答えは「インフラ層（Cloud Run）では全開放し、**アプリケーション層（Next.js）で認証する**」という役割分担です。
`web/src/app/api/` の各 Route が Supabase Auth でユーザー検証をしています（後述のバッチ用エンドポイントは別方式）。

---

## Part 2: デプロイの流れ — コードが本番に届くまで

`main` ブランチにコードがマージされてから本番で動くまで、次の旅をします。

```
git push → GitHub Actions → Dockerイメージをビルド
        → Artifact Registry に push → Cloud Run に「新イメージで動け」と指示
```

定義ファイル: [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)

### 2.1 Dockerfile — アプリを「箱詰め」する

Cloud Run で動かすには、アプリをコンテナイメージにする必要があります。
[web/Dockerfile](../../web/Dockerfile) は **マルチステージビルド** という手法で書かれています。

```
ステージ1 (deps)    : 依存パッケージだけインストール
ステージ2 (builder) : ソースをコピーして pnpm build
ステージ3 (runner)  : ビルド成果物「だけ」をコピーした最小の実行イメージ
```

なぜ3段階に分けるのか:

1. **イメージが小さくなる**: 最終イメージにはソースコードも開発用パッケージも入らず、
   Next.js の standalone 出力（動作に必要な最小ファイル群）だけが残る。
   小さいイメージ＝転送が速い＝コールドスタートも短い
2. **キャッシュが効く**: `package.json` と `pnpm-lock.yaml` が変わらない限りステージ1は再利用され、ビルドが速い
3. **セキュリティ**: 実行ステージでは非rootユーザー（`nextjs`）で動かす。
   万一侵入されてもコンテナ内での権限が最小限になる

### 2.2 Artifact Registry — イメージの保管庫

ビルドしたイメージは Artifact Registry に push されます。
イメージの「住所」は次の形式です:

```
asia-northeast1-docker.pkg.dev / ai-product-446711 / kabu-news-ai / app : <gitのSHA>
└─ リージョンのレジストリ         └─ プロジェクトID     └─ リポジトリ   └─名前  └─ タグ
```

タグに `latest` ではなく **git のコミットSHA** を使っているのが重要です
（`deploy.yml` の `git rev-parse --short HEAD`）。
「今本番で動いているのはどのコミットか」が一意に特定でき、問題があれば旧SHAのイメージに即座に戻せます。

### 2.3 Workload Identity Federation (WIF) — パスワードなしの認証

ここがこの構成で一番面白い部分です。

GitHub Actions（GCPの外部）が GCP にイメージを push するには認証が必要です。
古典的な方法は「サービスアカウントキー（JSONファイル）をGitHub Secretsに保存する」でしたが、
これは **漏れたら終わりの合鍵を外部に預ける** 行為で、現在は非推奨です。

WIF は合鍵を作りません。仕組みを例え話でいうと:

1. GitHub が Actions 実行時に「このジョブは `Takeshi-005/kabu-news-ai` リポジトリの main ブランチから実行されています」という **身分証明書（OIDCトークン）** を発行する
2. GCP側には「GitHubが発行した身分証明書で、リポジトリ名が一致するものだけ信用する」という **受付窓口（Workload Identity Pool）** を用意しておく
3. 窓口を通過したら、GCP内の **サービスアカウント `github-actions-deploy`** に変身できる

```hcl
# terraform/workload-identity.tf:47
# セキュリティ: このリポジトリからのみ認証を許可
attribute_condition = "assertion.repository == '${var.github_repository}'"
```

この1行がないと「GitHub Actionsを使う世界中の誰でも」窓口（トークン交換）を通れてしまうため、必須の条件です。GitHub のトークンの発行元は全リポジトリで共通なので、Google もこうしたプロバイダでは attribute condition を必ず使うよう求めています。

なお本構成では、窓口を通ったあとの SA 側のバインディングでも `principalSet://…/attribute.repository/Takeshi-005/kabu-news-ai` と対象を絞っているので、鍵は二重になっています。さらに堅くするなら、リポジトリ名ではなく数値 ID（`assertion.repository_id`）で絞ります。名前は削除や改名のあと他人に取り直される可能性がありますが、ID は再利用されないためです。

`deploy.yml` 側の対応箇所:

```yaml
permissions:
  id-token: write # ← GitHubにOIDCトークンの発行を許可する宣言
steps:
  - uses: google-github-actions/auth@v3
    with:
      workload_identity_provider: "projects/.../workloadIdentityPools/github-actions-pool/providers/github-provider"
      service_account: "github-actions-deploy@....iam.gserviceaccount.com"
```

### 2.4 デプロイと検証

イメージ push 後、`deploy-cloudrun` アクションが Cloud Run に新リビジョンを作成します。
最後に `curl` で `/api/health` を叩き、**デプロイ直後に本当に動いているかを確認** してから完了です
（`deploy.yml` の "Verify deployment" ステップ）。

なお PR の段階でも Docker ビルドだけは実行されます（`push: ${{ github.event_name == 'push' }}` により push はしない）。
「マージしてからビルドが壊れていると気づく」事故を防ぐ工夫です。

---

## Part 3: バッチの流れ — Cloud Scheduler と OIDC 認証

### 3.1 Cloud Scheduler — クラウド版 cron

「毎朝9時に予測トレーニング問題を生成する」といった定時処理は Cloud Scheduler が担います。
実体は「決まった時刻に、決まったURLへHTTPリクエストを送るだけ」のシンプルなサービスです。

```hcl
# terraform/cloud-scheduler.tf:5-24（抜粋）
resource "google_cloud_scheduler_job" "prediction_generator" {
  schedule  = "0 9 * * *"      # cron書式: 毎日9時0分
  time_zone = "Asia/Tokyo"     # JSTで解釈させる（デフォルトはUTCなので明示が重要）

  http_target {
    uri         = "${google_cloud_run_v2_service.app.uri}/api/cron/generate-prediction"
    http_method = "POST"
    oidc_token {
      service_account_email = google_service_account.scheduler.email
      audience              = google_cloud_run_v2_service.app.uri
    }
  }
}
```

`retry_config` により失敗時は自動リトライ（2回）されます。
AI生成のような不安定な処理には必須の保険です。

### 3.2 バッチ用エンドポイントを誰でも叩けたらまずい — OIDC トークン検証

Part 1 で見たとおり Cloud Run は全公開です。
すると `/api/cron/generate-prediction` も理論上は誰でも叩けてしまい、
外部の人が勝手にAI生成（＝課金発生）を実行できてしまいます。

対策が `oidc_token` ブロックです。Scheduler はリクエスト時に
「私は `api-scheduler` サービスアカウントです」というGoogle署名付きの身分証明書（OIDCトークン）を
`Authorization` ヘッダーに添えて送ります。

そしてアプリ側で検証します:

```typescript
// web/src/shared/lib/verify-scheduler-token.ts（抜粋）
const ticket = await client.verifyIdToken({ idToken: token });
const payload = ticket.getPayload();
return payload?.email === schedulerEmail && payload?.email_verified === true;
```

チェックしているのは2点:

1. トークンが **Googleによって正しく署名されているか**（`verifyIdToken` が署名を検証）
2. トークンの持ち主が **`api-scheduler@<project>.iam.gserviceaccount.com` 本人か**

偽造トークンは1で弾かれ、他人の正規トークンは2で弾かれます。
Part 2 の WIF と同じ「OIDCトークンによる身元証明」パターンが、ここでも使われていることに注目してください。

> 💡 **さらに知っておきたいこと**
>
> - **宛先（audience）は確認していない**: `verifyIdToken` に `audience` を渡していないため、トークンが「このサービス宛て」かは照合していません。Terraform では `audience = Cloud Run の URI` と設定しているので、アプリ側でも同じ値を渡して照合するのがより堅い形です。
> - **`scheduler_invoker` は今は門番ではない**: `api-scheduler` に `run.invoker` を付与していますが、`allUsers` にも同じロールがあるため、Cloud Run の IAM はこのリクエストを止めません。本当の門番は上のアプリ側の検証です。
> - **非公開にするとこの検証は使えない**: サービスを非公開にすると、Cloud Run が IAM でトークンを検証したあと、使い回しを防ぐために**署名を取り除いてから**アプリに渡します。そのため `verifyIdToken` は失敗するようになり、検証は IAM に任せてアプリはクレーム（`email`）を読むだけ、という形に変える必要があります。

---

## Part 4: IAM — 「誰が何をしていいか」の設計

### 4.1 サービスアカウントとは

サービスアカウント（SA）は **人間ではなくプログラムのためのアカウント** です。
「このプログラムは何をしていいか」を、人間のアカウントと同じ仕組み（IAM）で制御できます。

本プロジェクトには3つのSAがいて、それぞれ役割が1つずつです:

| サービスアカウント | 誰が使うか | 与えられた権限（ロール） |
| ------------------ | ---------- | ------------------------ |
| `cloud-run-app` | Cloud Run 上のアプリ | Vertex AI の利用 (`aiplatform.user`)、各Secretの読み取り (`secretmanager.secretAccessor`) |
| `api-scheduler` | Cloud Scheduler | Cloud Run の呼び出しのみ (`run.invoker`) |
| `github-actions-deploy` | GitHub Actions | イメージpush (`artifactregistry.writer`)、デプロイ (`run.developer`)、Cloud Run SAの使用 (`iam.serviceAccountUser`) |

### 4.2 最小権限の原則

上の表を見ると、どのSAも **仕事に必要な範囲に絞った権限** を持っていることがわかります（例外は 4.3 で見る `aiplatform.user` で、実際に必要な範囲より広い）。
これを **最小権限の原則 (Principle of Least Privilege)** と呼びます。

特に Secret Manager の権限付与は徹底しています。
「Secret Manager 全体の読み取り権限」を渡すのではなく、**シークレット1つずつに個別に** 権限を付けています:

```hcl
# terraform/secrets.tf:63-67（これがシークレットの数だけ並んでいる）
resource "google_secret_manager_secret_iam_member" "cloud_run_supabase_url" {
  secret_id = google_secret_manager_secret.supabase_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}
```

冗長に見えますが、将来「アプリに読ませたくないシークレット」（例: Terraform専用の認証情報）を追加しても、
自動的にはアクセスできない、という安全性を買っています。

### 4.3 ロールの命名から権限の強さを読む

GCP のロール名は `roles/<サービス>.<役割>` の形式で、役割部分から強さが読み取れます:

- `run.invoker`: 呼び出せる**だけ**（Schedulerに付与）
- `run.developer`: サービスの更新ができる（CI/CDに付与）— invoker より強い
- `aiplatform.user`: 名前は「user」だが、推論の呼び出しだけでなく、エンドポイント・データセット・モデルの作成や削除まで含む 451 個の権限を持つ広いロール（IAM 上の表示名は現在「Agent Platform User」）

「admin を安易に配らず、動詞レベルで絞る」のがIAM設計の基本です。

ただし `aiplatform.user` の例のとおり、**ロール名だけで権限の範囲は判断できません**。本構成で Gemini を呼ぶだけなら、推論に必要な権限だけを入れたカスタムロールに絞る余地があります。付与する前に `gcloud iam roles describe roles/aiplatform.user` のように中身を確認する習慣をつけましょう。

---

## Part 5: Secret Manager — 秘密情報の3段階の扱い

APIキーやDBの接続情報を **コードやGitに書いてはいけない** のは大原則です。
では本番のアプリはどうやってそれらを受け取るのか。本プロジェクトでは3種類の経路があります。

### 5.1 実行時シークレット（最重要）— Secret Manager → 環境変数

`SUPABASE_SERVICE_ROLE_KEY` のような強力な秘密情報は Secret Manager に保管し、
Cloud Run が起動時に環境変数として注入します:

```hcl
# terraform/cloud-run.tf:96-103
env {
  name = "SUPABASE_SERVICE_ROLE_KEY"
  value_source {
    secret_key_ref {
      secret  = google_secret_manager_secret.supabase_service_role_key.secret_id
      version = "latest"
    }
  }
}
```

ポイント: Terraform が管理するのは「シークレットという**入れ物**」だけで、
**値そのものは `gcloud` コマンドで手動登録** します（`terraform/secrets.tf` 冒頭のコメント参照）。
値をTerraformに書くと State ファイルに平文で残ってしまうためです。

もう1つの注意点: 環境変数として渡す Secret は、**インスタンスの起動時に1回だけ**読み込まれます。Secret を更新しても動作中のインスタンスには反映されないため、確実に反映するには新しいリビジョンをデプロイします。Google はこの理由から、環境変数で使う Secret は `latest` ではなくバージョンを固定することを推奨しています（常に最新を読みたい場合はボリュームとしてマウントする）。

### 5.2 ビルド時変数 — `NEXT_PUBLIC_*`

`NEXT_PUBLIC_` で始まる変数は **ブラウザに送られるJavaScriptに埋め込まれる** ため、
そもそも秘密ではありません（誰でも見られる前提の値）。
ただし埋め込みはビルド時に行われるので、Dockerfile では `ARG` として **ビルド時に** 渡します:

```dockerfile
# web/Dockerfile:18-21
# NEXT_PUBLIC_ 変数はビルド時に必要（クライアントサイドにバンドルされる）
ARG NEXT_PUBLIC_SUPABASE_URL
```

### 5.3 ビルド時シークレット — BuildKit secret mount

ビルド中だけ必要で、イメージに残してはいけない値（`SUPABASE_SERVICE_ROLE_KEY`）は、
`ARG` ではなく BuildKit の secret mount を使います:

```dockerfile
# web/Dockerfile:29-31
RUN --mount=type=secret,id=SUPABASE_SERVICE_ROLE_KEY \
    SUPABASE_SERVICE_ROLE_KEY=$(cat /run/secrets/SUPABASE_SERVICE_ROLE_KEY) \
    pnpm build
```

`ARG` で渡すとイメージの履歴（`docker history`）に値が残る可能性がありますが、
secret mount は **そのRUN命令の実行中だけ** ファイルとして見え、イメージには一切残りません。

### 5.4 まとめ表

| 種類 | 例 | 渡し方 | 秘密度 |
| ---- | -- | ------ | ------ |
| 実行時シークレット | `SUPABASE_SERVICE_ROLE_KEY`（実行用） | Secret Manager → Cloud Run env | 高 |
| ビルド時シークレット | 同上（ビルド用） | BuildKit secret mount | 高 |
| ビルド時公開変数 | `NEXT_PUBLIC_SUPABASE_URL` | Docker `ARG` | なし（公開前提） |
| ただの設定値 | `GCP_PROJECT_ID`, `NODE_ENV` | Terraform で直接 env 指定 | なし |

---

## Part 6: コスト最適化の工夫まとめ

個人開発でクラウドを使う上で最重要のテーマです。本構成の工夫を一覧にします:

| 工夫 | 場所 | 効果 |
| ---- | ---- | ---- |
| `min_instance_count = 0` | cloud-run.tf | アクセスゼロなら課金ほぼゼロ |
| `max_instance_count = 2` | cloud-run.tf | 同時処理量を抑え、課金が一気に膨らむのを防ぐ（請求総額の上限ではない） |
| `cpu_idle = true` | cloud-run.tf | CPU 課金はリクエスト処理中と起動・停止時のみ |
| マルチステージビルド | Dockerfile | イメージ縮小 → 転送・起動が速く安い |
| GitHub Actions キャッシュ (`cache-from: type=gha`) | deploy.yml | ビルド時間短縮（Actionsの無料枠節約） |
| Scheduler ジョブの `paused = true` | cloud-scheduler.tf | 実行を止めて Cloud Run と Gemini の費用を止める（再開が容易）。ただし一時停止中のジョブも課金対象として数えられる（請求先アカウントごとに月3ジョブまで無料、以降は1ジョブ月 $0.10） |

---

## Part 7: トラブル時にどこを見るか（入門）

| 症状 | 最初に見る場所 |
| ---- | -------------- |
| デプロイが失敗した | GitHub Actions のログ（Build / Deploy どちらのジョブで落ちたか） |
| デプロイ成功したのに起動しない | Cloud Run のログ。startup_probe 失敗なら `/api/health` かポート設定を疑う |
| バッチが動いていない | Cloud Scheduler の実行履歴 → ステータスコード。401 ならアプリのトークン検証（`verifySchedulerToken`）で拒否されている、500 ならアプリのログへ。403 は Cloud Run の IAM が拒否したときに返るが、本構成は `allUsers` に公開しているため通常は出ない |
| 環境変数が undefined | `NEXT_PUBLIC_*` なら、Docker ビルド時に `ARG` で渡されているか。それ以外なら、Cloud Run のサービス設定に env が定義されているか |
| Secret を読めずデプロイが失敗する・起動しない | Secret Manager に値（バージョン）が登録されているか。実行用 SA にその Secret の `secretAccessor` があるか（Cloud Run はデプロイ時にこれを確認し、読めなければ失敗させる） |

ログの読み方の詳細は [Cloud Logging 学習ガイド](./CLOUD_LOGGING.md) を参照してください。

---

## 演習: 自分の言葉で説明してみよう

学んだことを定着させるため、以下の問いに自分の言葉で答えを書いてみてください。
（答えはこのファイルに直接書き込んでOKです。すべて本文中に根拠があります）

**Q1. 毎朝9時の予測トレーニング生成で、リクエストがアプリに届いて認証されるまでの流れを、登場する GCP サービスと認証の仕組みを含めて3〜5行で説明してください。**

<!-- TODO(human): Q1の答えをここに書く -->

**Q2. もし攻撃者が `/api/cron/generate-prediction` に直接 POST したら、どこで・なぜ弾かれますか？**

<!-- Q2の答え: -->

**Q3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` はなぜ Secret Manager 経由の実行時注入ではなく、Docker ビルド時の `ARG` で渡す必要があるのでしょうか？**

<!-- Q3の答え: -->

---

## さらに学ぶには

### 本リポジトリ内の関連ドキュメント

- [Terraform 学習ガイド](./TERRAFORM_LEARNING.md) — この構成を「コードでどう定義しているか」側の解説
- [Terraform リファレンス](./TERRAFORM.md) — インフラ変更の実務手順
- [Cloud Logging 学習ガイド](./CLOUD_LOGGING.md) — エラー監視・ログの読み方
- [GCP設定](../setup/GCP.md) — プロジェクト初期設定の手順
- [CI/CD](../deployment/) — デプロイパイプラインの詳細

### 学習の次のステップ（公式ドキュメント）

1. [Cloud Run の仕組み](https://cloud.google.com/run/docs/overview/what-is-cloud-run) — インスタンス・リビジョン・トラフィック分割の概念
2. [IAM の概要](https://cloud.google.com/iam/docs/overview) — プリンシパル・ロール・ポリシーの3点セット
3. [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation) — キーレス認証の全体像
