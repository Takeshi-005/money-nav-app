# Terraform 学習ガイド — なぜこの構成なのか

本プロジェクトの Terraform 構成を「**なぜそうなっているのか（WHY）**」を中心に解説する初学者向けの学習ガイドです。実際のコードと結びつけて、Terraform のベストプラクティスと Google Cloud のリソース設計を理解できることを目指します。

> ⚠️ **サービス終了に伴い、2026-08-18 に GCP リソースを削除済みです。** Terraform の state からも除去済み（API 有効化の `google_project_service` 9件を除く）で、`.tf` の定義だけが残っています。この状態で `terraform plan` を実行すると削除したリソースが「追加予定」として表示され、`terraform apply` すると**作り直しが始まり、課金の対象が再び作られます**。ただし、新しく作られる Artifact Registry は空でイメージがないため Cloud Run の作成で失敗し、途中まで作られた状態で止まります。本書はコードを読んで学ぶ資料として使い、`apply` は実行しないでください。経緯は [docs/shutdown/SHUTDOWN_CHECKLIST.md](../shutdown/SHUTDOWN_CHECKLIST.md) を参照してください。

---

## はじめに

### このドキュメントの目的

1. **Terraform のベストプラクティスを、実コードから理解する**
2. **本プロジェクトで使っている Google Cloud のリソースが、なぜそのリソースなのかを理解する**

「これは何か？」より「**なぜこうなっているのか？**」を優先して書いています。手順や API リファレンスは既存ドキュメントに任せ、本書では設計判断の根拠を順番にたどっていきます。

### 想定読者・前提知識

| 項目                       | 前提                                                 |
| -------------------------- | ---------------------------------------------------- |
| Terraform                  | 触ったことがない／コマンドを真似たことがある程度でOK |
| Google Cloud               | 触ったことがない／コンソールを見たことがある程度でOK |
| シェル・Git                | 基本コマンドが分かる                                 |
| 認証 / IAM / コンテナの概念 | 用語を聞いたことがある程度でOK（本書で都度説明します）|

### 読み方

上から順番に読むことを想定しています。Part 1 〜 Part 4 まで合わせて 30〜60 分で読めます。

| Part   | 内容                                                       | こんな疑問に答えます                                   |
| ------ | ---------------------------------------------------------- | ------------------------------------------------------ |
| Part 1 | Terraform の基本                                           | そもそも Terraform って何が嬉しいの？                  |
| Part 2 | なぜ本プロジェクトはこのファイル構成なのか                 | ファイルが分かれているのは何のため？                   |
| Part 3 | GCP リソース解説（実コードと紐付け）                       | Cloud Run、IAM、Workload Identity って何のためにある？ |
| Part 4 | ベストプラクティスの根拠                                   | なぜ "latest" タグを禁止しているの？                   |

### 関連ドキュメント（リファレンスマップ）

| 目的                                  | ドキュメント                                                                |
| ------------------------------------- | --------------------------------------------------------------------------- |
| 操作手順を知りたい（init/plan/apply） | [terraform/README.md](../../terraform/README.md)                            |
| 既存の Terraform リファレンス         | [docs/development/TERRAFORM.md](./TERRAFORM.md)                             |
| GCP の初期設定をしたい                | [docs/setup/GCP.md](../setup/GCP.md)                                        |
| 環境変数・シークレットの仕様          | [docs/setup/SECRETS.md](../setup/SECRETS.md)                                |
| CI/CD（GitHub Actions）の仕組み       | [docs/deployment/CICD.md](../deployment/CICD.md)                            |
| IaC 設計レビューの履歴                | [docs/deployment/IAC_REVIEW.md](../deployment/IAC_REVIEW.md)                |

---

## Part 1: Terraform の基本 — なぜ IaC（Infrastructure as Code）なのか

### 1.1 なぜ「コードでインフラを管理する」のか

クラウドのリソースは GCP コンソール（Web UI）からクリック操作で作ることもできます。では、なぜわざわざ Terraform のような IaC ツールを使うのでしょうか。

GUI 操作と IaC の違いを並べると、利点がはっきり見えます。

| 観点         | GUI でクリック操作          | Terraform（IaC）                              |
| ------------ | --------------------------- | --------------------------------------------- |
| **再現性**   | 操作した人の記憶頼り        | コードに残るので誰がやっても同じ結果になる    |
| **レビュー** | 不可能（変更前後の差分なし）| PR で diff を見てレビューできる               |
| **ロールバック** | 「何を変えたか」覚えていないと戻せない | Git で戻して `apply` すれば以前の構成に戻る（削除したデータは戻らない） |
| **ドキュメント化** | 別途 Wiki などに書く必要 | コード自体がドキュメント                      |
| **複製**     | 同じ操作を手で繰り返す      | 同じコードで別環境に複製可能                  |

つまり Terraform は「**インフラを Git で管理できるようにする**」ためのツールです。これにより、アプリケーションコードと同じ品質管理プロセス（レビュー、テスト、CI/CD）をインフラにも適用できます。

### 1.2 terraform plan / apply のライフサイクル

Terraform を使うときの基本サイクルは 3 ステップです。

```
1. terraform init    → プロバイダーとバックエンドの初期化（初回および設定変更時）
2. terraform plan    → これから何が変わるかを「ドライラン」で表示
3. terraform apply   → 実際に GCP のリソースを変更する
```

`terraform init` は「最初の1回だけ」ではなく、**以下のタイミングで都度再実行が必要** です：

- 初めてこのディレクトリを `clone` した直後
- `main.tf` の `required_providers` でプロバイダーバージョンを変更したとき
- `backend.tf` の設定や `-backend-config` の値を変更したとき
- 新しいモジュール（`module` ブロック）を追加したとき

**なぜ `plan` と `apply` が分かれているか**：

クラウドのリソース変更は取り返しがつかないことがあります（例：DB を消すと中身も消える）。`plan` で **事前に「何が追加され、何が変更され、何が削除されるか」を確認** してから `apply` する設計になっています。

```bash
# plan の出力例
Plan: 2 to add, 1 to change, 0 to destroy.
#     ↑追加     ↑変更       ↑削除（ここが0以外のときは要注意！）
```

「0 to destroy」かどうか、特に DB やストレージで注目する習慣をつけると事故を防げます。

### 1.3 State — Terraform が「現実」と「コード」を結びつける鍵

Terraform の核心は **State（状態ファイル）** です。State には「コードで定義したリソースが GCP 上のどのリソースに対応するか」のマッピングが記録されています。

**なぜ State が必要か**：

- コード上で `google_cloud_run_v2_service "app"` と書いたとき、Terraform は「これは GCP 上のどの Cloud Run サービスか」を知る必要がある
- State がなければ、Terraform は既存のリソースを知らないまま「新規作成」しようとする。名前が一意のリソースなら「すでに存在する」エラーで止まり、そうでなければ重複したリソースができてしまう
- State には前回の `apply` 時点のリソースの属性が保存される。`plan` は既定で GCP の API から最新の実状態を読み直し（refresh）、コードとの差分を計算する

**なぜ State を GCS に保存するか**（本プロジェクトの場合）：

```hcl
# terraform/backend.tf
terraform {
  backend "gcs" {
    # bucket と prefix は terraform init -backend-config で指定
  }
}
```

理由は 2 つあります：

1. **ローカル PC が壊れても State を失わない**：State をローカルに置くと、PC が壊れた瞬間に「コードと現実の対応関係」が失われます。GCS に置けば、他の端末や CI/CD からも同じ State を共有できます。
2. **State Locking（排他制御）が効く**：複数人（あるいは人と CI）が同時に `apply` すると State が壊れる可能性があります。GCS バックエンドは実行時に自動でロックを取得し、ロック中の別の実行を止めます。ただし既定では、ロックが空くのを**待たずにエラーで終了**します（`-lock-timeout` の既定値は `0s`）。待たせたいときは、本プロジェクトの CI のように `-lock-timeout=5m` を指定します。

詳しくは [terraform/README.md の State Locking セクション](../../terraform/README.md) を参照してください。

### 1.4 HCL 文法の最低限

Terraform のコードは **HCL（HashiCorp Configuration Language）** で書きます。本プロジェクトで使っている主要な構文は 5 つだけです。

#### resource — 作成するリソース

「GCP 上に新しく作るもの」を表します。

```hcl
# terraform/cloud-run.tf:24-26 より抜粋
resource "google_cloud_run_v2_service" "app" {
  name     = local.project_name
  location = var.region
  ...
}
```

- `"google_cloud_run_v2_service"` … リソースの種類（Google プロバイダーが提供）
- `"app"` … このコード内での識別名（Terraform 内部での名前）

#### variable — 外部から渡す値

```hcl
# terraform/variables.tf:3-11 より抜粋
variable "project_id" {
  description = "GCP Project ID where resources will be created"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "Project ID must be valid GCP format (6-30 chars, lowercase, hyphens allowed)"
  }
}
```

`validation` ブロックがあるのがポイント。**間違った値を渡したときに `apply` 前にエラーで止めてくれる**ので、本番事故が防げます。

#### locals — コード内の定数

```hcl
# terraform/locals.tf:5-19 より抜粋
locals {
  project_name          = "kabu-news-ai"
  artifact_registry_url = "${var.region}-docker.pkg.dev/${var.project_id}"
  cloud_run_image       = "${local.artifact_registry_url}/${local.project_name}/app:${var.app_image_tag}"
}
```

「同じ値が複数箇所に出てくるのを一元化する」のが目的です。プロジェクト名を変えたいときに `locals.tf` の 1 行だけ書き換えればよくなります（DRY 原則）。

#### output — 外部に渡す値

```hcl
# terraform/outputs.tf:3-7 より抜粋
output "app_url" {
  description = "Next.js App Cloud Run URL"
  value       = google_cloud_run_v2_service.app.uri
  sensitive   = false
}
```

`terraform apply` の最後に表示される値です。CI/CD で「デプロイしたサービスの URL を取得して別ジョブに渡す」といった使い方をします。

#### data — 既存リソースを参照する

本プロジェクトではほぼ使っていませんが、「Terraform で管理していない既存リソースの情報を読み取りたい」ときに使います。

> 💡 **重要**: `data` を使うと State にその値が平文で記録されます。Secret Manager の値を `data` で読み取ると tfstate にシークレットが平文で残るため、本プロジェクトでは絶対に使いません。詳しくは [docs/issues/CLOUD_SCHEDULER_OIDC_MIGRATION.md](../issues/CLOUD_SCHEDULER_OIDC_MIGRATION.md) を参照してください。

---

## Part 2: なぜ本プロジェクトはこの構成なのか

### 2.1 ファイル分割の責務 — 「目的別に分ける」というベストプラクティス

`terraform/` ディレクトリを見ると、ファイルが細かく分かれています。

```
terraform/
├── main.tf                # プロバイダー設定 + API有効化
├── backend.tf             # State 保存先設定
├── variables.tf           # 入力変数の定義
├── locals.tf              # 内部用ローカル変数
├── outputs.tf             # 出力値の定義
├── cloud-run.tf           # Cloud Run + Artifact Registry
├── cloud-scheduler.tf     # Cloud Scheduler ジョブ
├── iam.tf                 # IAM (権限管理)
├── secrets.tf             # Secret Manager
├── workload-identity.tf   # Workload Identity (GitHub Actions 認証)
├── terraform.tfvars.example  # 変数値のテンプレート
└── .terraform.lock.hcl    # プロバイダーバージョンの固定（Git管理対象）
```

**Terraform はディレクトリ内の `.tf` ファイルをすべて連結して 1 つとして扱う** ので、技術的には 1 ファイルにすべて書いてもよいのです。それでも分けるのは、人間が読むためです。

#### なぜリソース種別ごとにファイルを分けるか

| ファイル                | 何を管理               | このファイルだけ見ればわかること                   |
| ----------------------- | ---------------------- | -------------------------------------------------- |
| `cloud-run.tf`          | アプリ実行環境         | アプリのスペック・環境変数・ヘルスチェック         |
| `cloud-scheduler.tf`    | バッチ実行             | どのバッチが何時に何を呼び出すか                   |
| `iam.tf`                | 権限管理               | 誰が何にアクセスできるか                           |
| `secrets.tf`            | シークレット管理       | どんなシークレットがあり、誰が読めるか             |
| `workload-identity.tf`  | GitHub Actions の認証 | CI/CD がどうやって GCP にログインするか            |

**WHY**: 1 ファイル 1 関心事にすることで、「あの権限どこだっけ？」「あのバッチどこだっけ？」が即座にわかります。これは [マーティン・ファウラーのリファクタリング原則](../../CLAUDE.md) の「**関数の責務を単一に保つ**」をインフラに適用したものです。

### 2.2 `main.tf` / `variables.tf` / `locals.tf` / `outputs.tf` の役割

これは Terraform の **標準モジュール構造（Standard Module Structure）** が推奨する `main.tf` / `variables.tf` / `outputs.tf` の3分割に、ローカル値用の `locals.tf` を加えた構成です。

| ファイル        | 役割                       | なぜ分けるか                                             |
| --------------- | -------------------------- | -------------------------------------------------------- |
| `main.tf`       | プロバイダー定義・API 有効化 | 「Terraform 全体の前提」を 1 か所にまとめる              |
| `variables.tf`  | 入力変数（外部から渡す）   | 「このコードに何を渡せば動くか」が一目でわかる           |
| `locals.tf`     | 内部用の計算済み値         | コード内の重複を排除（DRY 原則）                         |
| `outputs.tf`    | 出力値（外部に渡す）       | 「このコードを実行すると何が得られるか」が一目でわかる   |

実例：本プロジェクトの `main.tf` は **2 つの責務だけ** を持ちます。

```hcl
# terraform/main.tf:3-12
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# terraform/main.tf:20-35
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "cloudscheduler.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "aiplatform.googleapis.com",
    "searchconsole.googleapis.com",
    "analyticsdata.googleapis.com",
  ])
  ...
}
```

- 前半：Terraform 本体と Google プロバイダーのバージョン宣言
- 後半：必要な GCP API（サービス）を有効化

**WHY**: GCP では「API を有効化していないとリソースが作れない」という制約があります。これを Terraform 自身に管理させることで、新しい環境を立ち上げるとき `terraform apply` だけで API 有効化まで自動化できます。

### 2.3 `backend.tf` を空欄にした理由

```hcl
# terraform/backend.tf
terraform {
  backend "gcs" {
    # bucket と prefix は terraform init -backend-config で指定
  }
}
```

`bucket` と `prefix` を **わざと空欄** にしています。これは Terraform の **Partial Configuration** という機能で、初期化時に外部から値を渡すパターンです。

**WHY**: バケット名をコードにハードコードすると、別の GCP プロジェクト（例：個人の検証用プロジェクト）で同じコードを使い回せなくなります。空欄にしておけば、`terraform init -backend-config="bucket=任意-terraform-state"` で別バケットを指定できるため、コードがそのままで複数環境に対応できます。

**落とし穴**: 部分設定では、**渡し忘れた値がエラーにならず、黙って既定値になります**。GCS バックエンドの `prefix` は省略でき、省略すると state はバケット直下に置かれます。本プロジェクトでは、文書で `prefix=kabu-news-ai` と決めていたのに、2026-02-19 にローカルで prefix を付けずに `init` したため、それ以降の state はバケット直下に作られました。prefix 側には2月の古い state（平文のシークレット入り）が残り続け、CI の plan もそちらを見ていました（2026-09-24 に削除）。state を触る前には、`.terraform/terraform.tfstate` に記録された backend の設定を確認しましょう。

### 2.4 `.terraform.lock.hcl` をコミットする理由

`.terraform.lock.hcl` は `terraform init` 時に自動生成されるファイルで、**使用している Google プロバイダーの正確なバージョンとハッシュ値** が記録されています。

```hcl
# terraform/.terraform.lock.hcl より抜粋
provider "registry.terraform.io/hashicorp/google" {
  version     = "5.45.2"
  constraints = "~> 5.0"
  hashes = [
    "h1:iy2Q9VcnMu4z/bH3v/NmI/nEpgYY7bXgJmT/hVTAUS4=",
    ...
  ]
}
```

これは npm の `package-lock.json` や pnpm の `pnpm-lock.yaml` に相当します。

**WHY (なぜ Git にコミットするか)**:

- コミットしていない場合：開発者 A は `google v5.10.0`、CI/CD は `google v5.45.2` のように **環境ごとに異なるバージョン** が使われる可能性がある
- これは「ローカルでは動いたのに本番で壊れる」事故の温床になる
- HashiCorp 公式も [「依存ロックファイルはバージョン管理に含めるべき」](https://developer.hashicorp.com/terraform/language/files/dependency-lock) と明言

本プロジェクトでも以前は `.gitignore` に含まれていましたが、ベストプラクティス違反だったため Git 管理下に移しました。

### 2.5 `terraform.tfvars` と `terraform.tfvars.example` の使い分け

| ファイル                    | Git 管理 | 中身                                                |
| --------------------------- | -------- | --------------------------------------------------- |
| `terraform.tfvars`          | ❌ 除外 | プロジェクトの実値（GCP プロジェクト ID など）      |
| `terraform.tfvars.example`  | ✅ 含む | テンプレート（プレースホルダー値）                  |

**WHY**: `terraform.tfvars` には GCP プロジェクト ID やメールアドレスなど、リポジトリを Public にした場合に推測材料になる値が含まれます。完全な秘匿情報ではなくても、**最小公開の原則** に従って Git に含めません。

新規開発者は次のフローでセットアップします：

```bash
cp terraform.tfvars.example terraform.tfvars  # テンプレートをコピー
vim terraform.tfvars                          # 自分の値に書き換え
```

詳しくは [terraform/terraform.tfvars.example](../../terraform/terraform.tfvars.example) を参照してください。

---

## Part 3: GCP リソース解説（実コードと紐付け）

ここからは各 GCP リソースについて「**何か / なぜ使うか / 本プロジェクトでの使い方**」の 3 段構成で解説します。

### 3.1 Cloud Run — アプリの実行環境

#### 何か

「コンテナを HTTPS で公開してくれるサーバーレスサービス」です。Docker イメージを渡すだけで、ロードバランサー・SSL・スケーリングを自動で用意してくれます。

#### なぜ Cloud Run なのか（他の選択肢との対比）

| 選択肢                       | 採用しなかった理由                                       |
| ---------------------------- | -------------------------------------------------------- |
| GCE（仮想マシン）            | OS のパッチ管理・スケーリング設定が手動で面倒            |
| GKE（Kubernetes）            | クラスタ運用コストが高い。小規模アプリには過剰           |
| Cloud Run functions（1st gen）<br>旧 Cloud Functions（1st gen） | 関数単位のモデルで Next.js のような複合アプリは載せにくい |
| Cloud Run functions<br>旧 Cloud Functions（2nd gen） | 2024年8月に Cloud Run へ統合・改名された、関数を置くための形態。Next.js のようなアプリ全体を載せるなら、コンテナをそのまま動かす Cloud Run サービスのほうが素直 |
| **Cloud Run**                | コンテナを渡すだけ、ゼロから自動スケール、無料枠が広い   |

本プロジェクトのような **小規模・低トラフィック・Next.js アプリ** には Cloud Run が最適です。

#### 本プロジェクトでの使い方

```hcl
# terraform/cloud-run.tf:24-35
resource "google_cloud_run_v2_service" "app" {
  name     = local.project_name
  location = var.region

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = 0  # ← ココが重要
      max_instance_count = 2
    }
    ...
  }
}
```

**`min_instance_count = 0` の意味と、なぜそうしているか**：

- 0 にすると、リクエストが来ないときはインスタンスが0台まで縮む（アイドルのインスタンスは最大15分ほど残るが、既定の課金方式ではアイドル中は課金されない）→ 低トラフィックなら **Cloud Run の無料枠に収まりやすい**
- ただし0台からの最初のリクエストはコンテナ起動から始まるため、数秒程度の「コールドスタート」が発生する
- 本プロジェクトは個人開発・無料運用が前提なので、**コスト > 体感速度** のトレードオフで 0 を選択
- 商用化やトラフィック増加でコールドスタートが許容できなくなった場合は、`min_instance_count = 1` 以上に上げて常時稼働させる選択肢があります（その分、月額コストが発生）

#### ヘルスチェック（startup_probe / liveness_probe）

```hcl
# terraform/cloud-run.tf:53-72
startup_probe {
  http_get {
    path = "/api/health"
    port = var.container_port
  }
  initial_delay_seconds = 5
  period_seconds        = 10
  failure_threshold     = 3
}

liveness_probe {
  http_get {
    path = "/api/health"
    port = var.container_port
  }
  period_seconds = 30
  ...
}
```

| Probe          | いつ実行            | 何のため                                    |
| -------------- | ------------------- | ------------------------------------------- |
| startup_probe  | コンテナ起動時のみ  | 成功するまでリクエストを流さない。期限内に成功しなければコンテナを停止する |
| liveness_probe | startup の成功後ずっと（30秒間隔） | 失敗が続くとコンテナを停止し、新しいインスタンスに置き換える |

**WHY**: startup_probe を書かなくても、Cloud Run は既定で「ポートが開くか」を最大240秒待つ TCP プローブを使います。それでも HTTP の startup_probe を明示しているのは、**ポートが開いただけでなく `/api/health` が実際に応答する**ことまで確かめてからリクエストを流すためです。本プロジェクトの設定では、起動からおよそ35秒（初回待ち5秒＋10秒×3回）以内に応答しなければ起動失敗とみなされます。

### 3.2 Cloud Scheduler — バッチ実行

#### 何か

「指定した時刻に HTTP リクエストを送ってくれる」サービスです。Linux の cron をマネージドにしたものと考えてください。

#### なぜ自前で cron サーバーを建てないか

- cron 専用の VM を建てると、それだけで月数百円〜数千円かかる
- VM の OS パッチ管理・死活監視が必要になる
- Cloud Scheduler は **請求先アカウントごとに月3ジョブまで無料**、それ以降も1ジョブあたり月 $0.10 と安い（無料枠はプロジェクト単位ではないので、同じ請求先アカウントの他プロジェクトと共有される）

本プロジェクトでは「**毎日決まった時刻に Cloud Run のエンドポイントを叩く**」だけが目的なので、これ以上のものは不要です。

#### 本プロジェクトでの使い方

```hcl
# terraform/cloud-scheduler.tf:5-35
resource "google_cloud_scheduler_job" "prediction_generator" {
  name      = "prediction-generator"
  schedule  = "0 9 * * *"          # 毎日9時
  time_zone = "Asia/Tokyo"

  http_target {
    uri         = "${google_cloud_run_v2_service.app.uri}/api/cron/generate-prediction"
    http_method = "POST"

    oidc_token {
      service_account_email = google_service_account.scheduler.email
      audience              = google_cloud_run_v2_service.app.uri
    }
  }

  retry_config {
    retry_count          = 2
    min_backoff_duration = "5s"
  }
}
```

#### OIDC Token とは、なぜ使うか

「**OIDC = OpenID Connect。Google が発行した署名付きトークンで、リクエストの送り主を証明する仕組み**」です。

仕組み：

1. Cloud Scheduler がリクエストを送る前に、Google から OIDC Token を発行してもらう
2. リクエストの `Authorization: Bearer <token>` ヘッダに付けて送信
3. Cloud Run 上のアプリ（`web/src/shared/lib/verify-scheduler-token.ts`）が Google の公開鍵でトークンの署名を検証し、`api-scheduler` SA からのリクエストかを確認

**WHY**: トークンなしで Cloud Run のエンドポイントを公開すると、URL が漏れた瞬間に誰でも叩けてしまいます。OIDC Token があれば「Cloud Scheduler 経由のリクエストだけ通す」設定が可能になります。

> 💡 本プロジェクトの Cloud Run は `allUsers` に公開しているため、Cloud Run 自体（IAM）はトークンを検証しません。`iam.tf` の `scheduler_invoker`（`run.invoker` の付与）も、`allUsers` がある限り門番としては働いていません。実際の門番はアプリの検証コードです。逆にサービスを非公開にすると、Cloud Run は IAM でトークンを検証したあと**署名を取り除いてから**アプリに渡すため、アプリ側での署名検証はできなくなります。

#### retry_config — 失敗したらリトライする

`retry_count = 2, min_backoff_duration = "5s"` の意味は「失敗したら最低 5 秒待ってから最大 2 回再試行」です。

**WHY**: ネットワークの一時的な揺らぎや、Cloud Run のコールドスタート中のタイムアウトでバッチが失敗することがあります。リトライがあると「朝になっても予測トレーニングが生成されていない」という事故を防げます。

### 3.3 Secret Manager — シークレットの保管庫

#### 何か

「API キー・パスワードなどの機密情報を暗号化して保管し、必要なときだけ取り出せるようにする」サービスです。

#### なぜ環境変数の直書きではダメか

| 直書きの問題                          | Secret Manager で解決                       |
| ------------------------------------- | ------------------------------------------- |
| `.env` を間違えてコミットすると流出    | 値が GCP 側にあり、コードには参照だけ残る  |
| 値を変えるたびにイメージの再ビルドが必要 | 新しいバージョンを登録し、新しいリビジョンをデプロイするだけ（再ビルド不要） |
| 誰が読めるかの粒度設定ができない      | リソース単位で IAM 制御できる               |

#### 本プロジェクト特有の設計：「リソースは Terraform、値は CI/CD から注入」

ここが特徴的なので 1 ステップずつ説明します。

```hcl
# terraform/secrets.tf:10-18
resource "google_secret_manager_secret" "supabase_url" {
  secret_id = "supabase-url"

  replication {
    auto {}
  }
}
```

Terraform は **Secret のリソース（入れ物）だけ** を作り、**値（中身）は管理しません**。値は `gcloud secrets versions add` コマンドで手動登録します（`terraform/secrets.tf` 冒頭のコメント参照）。以前は GitHub Actions が GitHub Secrets から自動で注入していましたが、2026-02 にそのステップは削除しました（`bcc0617`）。

**WHY**:

1. `terraform.tfvars` にシークレット値を書きたくない（Git 漏洩リスク）
2. もし Terraform で値も管理すると、`terraform.tfstate` に **平文** で記録されてしまう（過去にこの問題で対応した記録は [docs/issues/CLOUD_SCHEDULER_OIDC_MIGRATION.md](../issues/CLOUD_SCHEDULER_OIDC_MIGRATION.md) を参照）
3. 結論：**Terraform はリソース宣言だけ、値は Terraform の外（gcloud での登録）で管理する**

#### Cloud Run から Secret を読み取る

```hcl
# terraform/cloud-run.tf:95-103
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

これで Cloud Run は**インスタンスの起動時に** Secret Manager から値を読み込み、環境変数 `SUPABASE_SERVICE_ROLE_KEY` に入れます。**コードからは普通の環境変数として読めるのに、ソースコードやコンテナイメージには値が残らない** のがポイントです。

> ⚠️ 値は起動時に1回だけ読まれるので、Secret を更新しても動作中のインスタンスには反映されません。確実に反映するには新しいリビジョンをデプロイします。Google は、環境変数で使う Secret は `latest` ではなくバージョンを固定することを推奨しています（常に最新を読みたい場合はボリュームとしてマウントする）。

> ⚠️ `NEXT_PUBLIC_` で始まる変数（`NEXT_PUBLIC_SUPABASE_URL` など）は、Docker ビルド時に JavaScript へ埋め込まれてブラウザに配られます。本プロジェクトでは Secret Manager 経由でも渡していますが、値はイメージにも含まれ、そもそも秘密ではありません。

### 3.4 IAM — 「誰が何にアクセスできるか」を決める権限管理

#### 何か

GCP の権限管理システムです。「**プリンシパル（誰が）× リソース（何に）× ロール（どの権限で）**」の 3 つを組み合わせます。

#### なぜ「最小権限の原則」が大事か

例：もし Cloud Run のサービスアカウントに「プロジェクトオーナー」権限を付けたら：

- 攻撃者がアプリの脆弱性をついてサービスアカウントを乗っ取れば、**プロジェクト全体を破壊できる**
- バグでアプリが暴走すると、**意図しないリソースを作成・削除する可能性**

そのため、「**そのサービスが本当に必要な権限だけを付ける**」のが最小権限の原則です。

#### 本プロジェクトの IAM 設計

各サービスアカウント（SA）に必要な権限だけを個別に付与しています。

```hcl
# terraform/iam.tf:11-15
# Cloud Run SA → Vertex AI 呼び出しのみ
resource "google_project_iam_member" "cloud_run_vertex_ai" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# terraform/iam.tf:19-25
# Scheduler SA → Cloud Run の起動権限のみ
resource "google_cloud_run_v2_service_iam_member" "scheduler_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler.email}"
}
```

#### よく使う GCP ロールの早見表

| ロール名                              | 意味                                           |
| ------------------------------------- | ---------------------------------------------- |
| `roles/run.invoker`                   | Cloud Run を呼び出せる                         |
| `roles/run.developer`                 | Cloud Run をデプロイ・更新できる               |
| `roles/secretmanager.secretAccessor`  | Secret Manager の値を読める（書けない）        |
| `roles/aiplatform.user`               | Vertex AI を呼び出せる                         |
| `roles/artifactregistry.writer`       | Artifact Registry に Docker イメージを push できる |
| `roles/iam.workloadIdentityUser`      | Workload Identity 経由で SA を使える           |
| `roles/iam.serviceAccountUser`        | SA を「使う側」として指定できる                |
| `roles/iam.serviceAccountTokenCreator` | SA の代わりにトークンを発行できる（Impersonation） |

**設計原則**: 各 SA は 1〜3 個の最小限のロールだけ持つ。プロジェクトオーナーや Editor は **絶対に使わない**。

### 3.5 Workload Identity Federation — GitHub Actions の認証

ここが本プロジェクトで一番モダンな設計です。

#### なぜ Service Account Key が危険か

従来は GitHub Actions から GCP にアクセスするには、SA のキー（JSON ファイル）を GitHub Secrets に登録する方法が一般的でした。

**SA キーの問題**：

1. 一度漏れたら、キーを無効化するまで永続的に使われ続ける
2. キーローテーションを誰も手動で回さない
3. GitHub Secrets の中身をうっかり workflow ログに出してしまうリスク

#### Workload Identity Federation の仕組み

Workload Identity Federation（WIF）は、**SA キーを完全になくして、GitHub 自体の OIDC Token で認証する** 仕組みです。

```
[GitHub Actions]
    ↓ (1) workflow 実行時に GitHub が OIDC Token を発行
    ↓ (2) その Token を GCP に提示
[Workload Identity Pool / Provider]
    ↓ (3) 「このリポジトリからの Token なら信用する」と検証し、短期トークンに交換
[Service Account]
    ↓ (4) SA の権限を一時的に貸与（短時間で失効）
[GCP API]
```

短時間トークンなので、漏れても影響範囲が限定されます。SA キーのように「永続的なクレデンシャル」がそもそも存在しません。

#### 本プロジェクトでの実装

```hcl
# terraform/workload-identity.tf:29-48
resource "google_iam_workload_identity_pool_provider" "github_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_actions.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"  # ← GitHub が発行者
  }

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    ...
  }

  # このリポジトリからのみ認証を許可
  attribute_condition = "assertion.repository == '${var.github_repository}'"
}
```

**`attribute_condition` の重要性**：

このリポジトリ（`Takeshi-005/kabu-news-ai`）からの Token しか受け入れない設定です。これがないと、別の GitHub リポジトリの Token でもプールでのトークン交換が通ってしまいます。本プロジェクトは SA 側のバインディングでも `principalSet://…/attribute.repository/Takeshi-005/kabu-news-ai` と対象を絞っているので、条件がなくても直ちに SA を借りられるわけではありません。それでも、GitHub のように全リポジトリで発行元が共通のプロバイダでは、Google も attribute condition を必ず使うよう求めています。

さらに堅くするなら、リポジトリ名ではなく数値 ID（`assertion.repository_id`）で絞ります。名前は削除や改名のあと他人に取り直される可能性がありますが、ID は再利用されないためです。

詳しくは [docs/deployment/CICD.md](../deployment/CICD.md) と [docs/deployment/IAC_REVIEW.md](../deployment/IAC_REVIEW.md) を参照してください。

### 3.6 Artifact Registry — Docker イメージの保管庫

#### 何か

Docker イメージを保存しておくための GCP のレジストリです。Docker Hub の GCP 版と思ってください。

#### なぜ Container Registry（旧）ではないのか

GCP には以前 **Container Registry（GCR）** という同じ目的のサービスがありましたが、2025-03-18 に提供を終了し、イメージの書き込みができなくなりました。

| 観点                | Container Registry（旧）   | Artifact Registry（新）  |
| ------------------- | -------------------------- | ------------------------ |
| 公式ステータス      | 提供終了（2025-03-18〜書き込み不可） | 推奨           |
| サポート形式        | Docker のみ                | Docker・Maven・npm 等    |
| リージョン指定      | 制限あり                   | リージョン単位で柔軟     |
| IAM                 | ストレージ単位             | リポジトリ単位で細かく制御 |

現在は Artifact Registry 一択です。

#### 本プロジェクトでの使い方

```hcl
# terraform/cloud-run.tf:4-12
resource "google_artifact_registry_repository" "app" {
  location      = var.region
  repository_id = local.project_name
  format        = "DOCKER"
  description   = "Docker repository for ${local.project_name} app"
}
```

```hcl
# terraform/locals.tf:10-13
artifact_registry_url = "${var.region}-docker.pkg.dev/${var.project_id}"
cloud_run_image       = "${local.artifact_registry_url}/${local.project_name}/app:${var.app_image_tag}"
```

CI/CD ではここに `docker push` し、Cloud Run はここから pull します。CI/CD はコミット SHA をタグにして push するので、デプロイのたびに **コミットと1対1で対応するイメージ** が残ります（→ Part 4 で詳述）。Terraform の `app_image_tag` はサービス作成時にだけ使われ、以後のイメージ更新は CI/CD が担当します（`cloud-run.tf` の `ignore_changes`）。

なお Artifact Registry のタグは、既定では別のイメージに付け替えられます。コミット SHA が一意なのは運用上の約束です。タグの書き換えを禁止したい場合は、リポジトリに `docker_config { immutable_tags = true }` を設定します。

---

## Part 4: ベストプラクティスの根拠

最後に、Terraform の設計判断としてよく聞くベストプラクティスが、なぜベストプラクティスなのかを本プロジェクトの実コードで見ていきます。

### 4.1 Image Tag に "latest" を使わない理由（Immutable Infrastructure）

```hcl
# terraform/variables.tf:28-36
variable "app_image_tag" {
  description = "Docker image tag for Cloud Run (e.g., v1.0.0 or commit SHA). Must be specified explicitly."
  type        = string

  validation {
    condition     = length(var.app_image_tag) > 0 && var.app_image_tag != "latest"
    error_message = "app_image_tag must be specified and cannot be 'latest'. Use semantic version (v1.0.0) or commit SHA."
  }
}
```

`validation` で "latest" を **明示的に禁止** しています。

**WHY**: 「latest」は同じタグなのに指す中身が時間とともに変わります。

| 時刻       | "latest" が指すイメージ |
| ---------- | ----------------------- |
| 月曜 10:00 | abc1234（v1.0.0）       |
| 火曜 15:00 | def5678（v1.1.0、バグあり） |
| 水曜 12:00 | ghi9012（v1.1.1、修正版） |

Cloud Run 自体は、デプロイした時点でタグをイメージのダイジェスト（中身のハッシュ）に置き換えてリビジョンに固定します。そのため `latest` でデプロイしても、前のリビジョンに戻すことはできます。問題は Terraform とコードの対応です。

- Terraform のコードに `latest` と書くと、新しいイメージを push しても文字列が変わらないため、`plan` に差分が出ずデプロイのきっかけになりません
- タグ名を見ても、どのコミットのイメージかが分かりません

Git コミット SHA を使えば、コードとイメージが1対1で対応し、「abc1234 を再デプロイ」とはっきり指定できます（Immutable Infrastructure の考え方）。

### 4.2 環境変数 vs Secret Manager の使い分け

`cloud-run.tf` を見ると、環境変数の渡し方が 2 種類あります。

| 種類                       | 例                                  | いつ使うか                       |
| -------------------------- | ----------------------------------- | -------------------------------- |
| 普通の `value`             | `NODE_ENV = "production"`           | 公開しても問題ない設定値          |
| `value_source.secret_key_ref` | `SUPABASE_SERVICE_ROLE_KEY`         | 漏らしてはいけない値              |

```hcl
# terraform/cloud-run.tf:130-133
env {
  name  = "NODE_ENV"
  value = "production"  # 平文で OK
}

# terraform/cloud-run.tf:95-103
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

**判断基準**:
- 「もしリポジトリが Public になったら困る？」→ Yes なら Secret Manager
- それ以外（リージョン・モード・公開URLなど）→ 平文の `value`
- `NEXT_PUBLIC_*` はブラウザに配られる値なので、この基準では秘密に当たらない

### 4.3 「Terraform はリソース定義のみ、値は CI/CD から注入」の設計判断

これは Part 3.3 でも触れた本プロジェクトの中核設計です。

**もし Terraform で値も管理していたら**：

- `terraform.tfvars` に `supabase_service_role_key = "eyJhb..."` のように書く
- `terraform apply` 時に `terraform.tfstate` にも平文で記録される
- tfstate は GCS にあるが、誰かが `terraform state pull` で取り出せば見える

**現在の設計**：

```
開発者が gcloud secrets versions add で登録（値の管理は Terraform の外）
    ↓
Secret Manager（GCP 側、暗号化保管）
    ↓ Cloud Run がインスタンス起動時に secret_key_ref で読み込み
アプリ
```

2026-02 までは GitHub Actions が GitHub Secrets から自動で注入していましたが、`bcc0617` でそのステップを削除しました。

Terraform は **入れ物（Secret リソース）だけ作る**。値の流れには関与しない。これにより tfstate にシークレットが残らず、State を読めるだけでは値を見られません（値を読むには Secret への `secretAccessor` 権限が別途必要）。

### 4.4 State を小さく保つ理由

「State を小さく保つ」とは、「1 つの Terraform プロジェクトで管理するリソース数を増やしすぎない」という指針です。

**State が大きくなるとどうなるか**：

- `terraform plan` / `apply` が遅くなる（全リソースの差分を毎回計算するため）
- 1 か所のミスで全リソースに影響が出るリスクが上がる
- 複数人で並行作業しづらくなる（ロック競合）

本プロジェクトは現状単一 State ですが、将来環境分離（dev/staging/prod）するなら：

```
terraform/
├── envs/
│   ├── dev/        # dev 環境専用の State
│   ├── staging/
│   └── prod/
└── modules/        # 共通モジュール
```

のように State を分割します。詳しくは [docs/deployment/IAC_REVIEW.md](../deployment/IAC_REVIEW.md) の「環境分離」セクションを参照してください。

### 4.5 まとめ：本プロジェクトの設計原則

| 原則                                   | 体現箇所                                          |
| -------------------------------------- | ------------------------------------------------- |
| ファイルは責務ごとに分割               | `cloud-run.tf`, `iam.tf`, `secrets.tf`, etc.      |
| 入力値はバリデーションで守る           | `variables.tf` の `validation` ブロック群         |
| 重複は `locals.tf` に集約              | `project_name`, `cloud_run_image` など            |
| シークレットは Terraform に持たせない  | Secret リソースのみ作成、値は gcloud で登録        |
| 認証はキーレス（Workload Identity）    | `workload-identity.tf`                            |
| 権限は最小限                           | 各 SA に必要なロールだけ個別付与                  |
| イメージはコミット SHA で特定（latest 禁止） | `variables.tf` の `app_image_tag` validation |
| Backend は動的指定（コードに埋め込まない） | `backend.tf` の空欄 + `-backend-config`         |

これらは独立した小さな選択ですが、組み合わさることで「**事故が起きにくい・起きても被害が小さい**」インフラ運用ができるようになっています。

---

## さらに学ぶには

| 知りたいこと                                    | 参照先                                                       |
| ----------------------------------------------- | ------------------------------------------------------------ |
| 実際に terraform init/plan/apply を実行する手順 | [terraform/README.md](../../terraform/README.md)             |
| GCP プロジェクトの初期設定                      | [docs/setup/GCP.md](../setup/GCP.md)                         |
| 環境変数の一覧と意味                            | [docs/setup/SECRETS.md](../setup/SECRETS.md)                 |
| GitHub Actions の CI/CD フロー詳細              | [docs/deployment/CICD.md](../deployment/CICD.md)             |
| 過去の IaC 設計レビュー・改善履歴               | [docs/deployment/IAC_REVIEW.md](../deployment/IAC_REVIEW.md) |
| 既存の Terraform リファレンス                   | [docs/development/TERRAFORM.md](./TERRAFORM.md)              |
| State にシークレットが漏れた事故対応の記録      | [docs/issues/CLOUD_SCHEDULER_OIDC_MIGRATION.md](../issues/CLOUD_SCHEDULER_OIDC_MIGRATION.md) |

### 学習の次のステップ

1. **コードを読む**: リソースは削除済みのため、`terraform plan` を実行すると全リソースが「追加予定」と表示されます（`apply` は厳禁）。まずは `terraform/*.tf` と本書を突き合わせて読んでください
2. **自分の検証用プロジェクトで試す**: 本書の構成を個人の GCP プロジェクトで再現し、`max_instance_count` を 2 → 3 に変えて `plan` の差分を観察する（`backend.tf` が空欄なので、`-backend-config` で自分のバケットを指定できる）
3. **公式ドキュメントを読む**: [Terraform Google Provider 公式](https://registry.terraform.io/providers/hashicorp/google/latest/docs) — 各リソースのプロパティ一覧
4. **失敗事例を見る**: [docs/issues/](../issues/) — 実際にあった問題とその解決方法

「動いているコードを読む」のが一番速く学べます。本書をリファレンスにしながら、`terraform/` ディレクトリのコードを 1 ファイルずつ眺めてみてください。
