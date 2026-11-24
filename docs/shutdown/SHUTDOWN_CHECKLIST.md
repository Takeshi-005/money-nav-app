# マネイッポ サービス停止チェックリスト

作成日: 2026-08-17

投資学習サービス「マネイッポ」(money-nav.com) の提供を終了し、リソースを回収するための手順。
**上から順に実行すること。** 後戻りできない操作を後半に配置している。

## 前提となる環境の実測値

| 項目 | 値 |
|------|-----|
| GCP プロジェクト | `ai-product-446711` (プロジェクト番号 442603016332) |
| リージョン | `asia-northeast1` |
| Cloud Run サービス | `kabu-news-ai` |
| ドメインマッピング | `money-nav.com` → `kabu-news-ai` |
| Cloud DNS ゾーン | `money-nav` (Terraform 管理外・手動作成) |
| Artifact Registry | `kabu-news-ai` (**6,110 MB**) |
| Cloud Scheduler | `prediction-generator` / `glossary-generator`(停止中) / `seo-data-collector` |
| Supabase プロジェクト | `ykydeknqirisfppmhhrs` (public スキーマ 22テーブル) |
| GSC プロパティ | `sc-domain:money-nav.com` |
| GA4 プロパティ | `471603108` |
| Terraform state | `gs://ai-product-446711-terraform-state` のバケット直下 `default.tfstate`（prefix なし。作成時は prefix=`kabu-news-ai` と記載していたが誤り → Step 11） |

## 絶対に触らないもの

GCP プロジェクトは別サービス **`ai-product`** と共有している。以下は削除・変更してはいけない。

| リソース | 理由 |
|----------|------|
| プロジェクト `ai-product-446711` 自体 | `ai-product` が稼働中 |
| Cloud Run `ai-product` / Artifact Registry `ai-product` | 別サービスの本体 |
| 有効化済み API 群 | `ai-product` が使用中。Terraform も `disable_on_destroy = false` |
| Cloud DNS ゾーン `money-nav` | TXT の `google-site-verification` が GSC ドメインプロパティの認証を支えている。消すと過去データの参照権を失う |
| GCS バケット `money-nav` | 92KB。`stocks/` `reports/` の JSON で別系統の資産 |
| GCS バケット `ai-product-446711-terraform-state` | 共有プロジェクトの資産として残す。作成時は「prefix 違いで `ai-product` の state も同居」と記載したが、2026-09-24 の確認では中身は kabu-news-ai の state だけだった（Step 11） |
| WIF プール `my-pool` / プロバイダ `github-actions-oidc` | `assertion.repository_owner=='Takeshi-005'` 条件の別リポジトリ用 |
| SA `app-sa` / `networking-sa` / `github-actions-gcs-deploy` / `money-nav-gcs` | 別サービスの SA |

### `terraform destroy` を打ってはいけない

このワークスペースは `google_project_service.apis` を抱えている。`disable_on_destroy = false` なので
API 自体は無効化されないが、blanket destroy は共有プロジェクト上で不要なリスクを取る操作になる。
削除は `scripts/shutdown/03-teardown-gcp.sh` で個別に行い、state は Step 7 で明示的に整理する。

なお WIF プール `github-actions-pool` は `attribute_condition` が
`assertion.repository == 'Takeshi-005/kabu-news-ai'` に限定されているため、本リポジトリ専用で削除して問題ない。

---

## Step 1: 課金を止める（最優先・可逆）

日次の `prediction-generator` が Gemini を叩き続けるため、変動費はここで止まる。

```bash
for job in prediction-generator seo-data-collector; do gcloud scheduler jobs pause "$job" --project=ai-product-446711 --location=asia-northeast1; done
```

- [x] 3ジョブすべてが `PAUSED` になったことを確認 (`gcloud scheduler jobs list --location=asia-northeast1`) — 2026-08-17 完了
- [x] `terraform/cloud-scheduler.tf` に `paused = true` を反映（ジョブが作り直されたときも停止状態で作られるようにする）
- [ ] `prediction-generator` の Slack 通知が来ないことを確認（08-18 09:00 JST 以降）
- [ ] `seo-data-collector` の Slack 通知が来ないことを確認（08-24 09:00 JST 以降 / 週次・月曜）

宣言側にも `paused = true` を書く理由は、ジョブが作り直されたとき（`.tf` が残っているので、誰かが `apply` した場合を含む）に ENABLED で作られないようにするためである。

> 📝 **訂正（2026-09-24）**: 当初は「pause だけでは Terraform 側が `paused` 未指定のままドリフトし、`terraform apply` で ENABLED に戻って課金が再開する」と書いていたが、誤りだった。google プロバイダ 5.45.2 の `paused` は Optional＋Computed なので、コードで指定しなければ現在の値（PAUSED）をそのまま受け入れ、差分は出ない。

この時点でサイトはまだ生きている。以降の退避作業を落ち着いて行える。

---

## Step 2: Search Console のデータを退避（不可逆・16ヶ月ウィンドウから溢れると戻らない）

API 上限の直近16ヶ月分を、`query×page` / `query` / `date` の3つの切り口で全行取得する。

締切は「所有権が切れること」ではない。Cloud DNS ゾーン `money-nav` を維持する方針なので、`google-site-verification` の TXT が残り **GSC ドメインプロパティの所有権は停止後も切れない**。実際の締切は API が直近16ヶ月のローリングウィンドウであることで、1日経つごとに最古の1日が永久に失われる。

```bash
gcloud auth application-default login --scopes=https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform
```

```bash
node scripts/shutdown/01-export-gsc.mjs shutdown-archive/gsc
```

- [x] `shutdown-archive/gsc/query-page.csv` の行数を確認 — 2026-08-17 完了（query-page 148 / query 131 / date 488 行、2025-04-14〜2026-08-14）
- [x] `shutdown-archive/gsc/query.csv` を目視。**クリックゼロでインプレッションだけ出ているクエリ**が次のキーワード設計の原資
  - 16ヶ月合計で総クリック 13 / 総インプレッション 1,930。クリックゼロのクエリ 128 件
  - iDeCo 運用実績クラスタが約 791 インプレッション（`ideco ポートフォリオ` 337 他）だが平均順位 66〜100 位
  - `明日の好悪材料` は平均 9.4 位・51 インプレッションでクリックゼロ。1ページ目でも取れないという反証

ADC で `searchconsole.googleapis.com` を叩くには `x-goog-user-project` ヘッダーが必須（クライアントライブラリなら ADC の `quota_project_id` から自動付与されるが、依存なしの生 `fetch` では自前で送る）。未送信だと 403 `accessNotConfigured` になる。対応済み。

GA4 は 471603108 のプロパティを残しておけば参照可能。急いで消す理由はないので保留でよい。

---

## Step 3: Supabase をダンプ（不可逆）

`pg_dump` / supabase CLI が未導入なので、PostgREST 経由で全22テーブルを JSON + CSV に吸い出す。

```bash
node scripts/shutdown/02-dump-supabase.mjs shutdown-archive/supabase
```

- [x] `shutdown-archive/supabase/_meta.json` の `rowCounts` を確認 — 2026-08-17 完了。22テーブル・合計 1,878 行（最大 `seo_page_performance` 619 行）
- [x] `seo_search_performance.csv` が入っていることを確認（GSC の週次スナップショット履歴）— 125 行
- [x] `predictions` / `prediction_results` が入っていることを確認 — 3 行 / 83 行

`quiz_cache.csv` のみ空だが実データが 0 行のため正常。

なお `limit`/`offset` ページングは `ORDER BY` 未指定のため理論上は行順が不安定だが、全テーブルが `PAGE_SIZE=1000` 未満で1ページ完結するため発火しない。修正不要。

## Step 4: Secret Manager の値を退避 → **実施しない（2026-08-17 決定）**

**4つの値はすべて `web/.env` に平文で既に存在する**（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `SLACK_WEBHOOK_URL`）。`shutdown-archive/secrets/` へコピーしても同一マシン上の平文コピーが2つになるだけで、可用性は増えずセキュリティのみ悪化する。

> 📝 **追記（2026-09-24）**: 平文のコピーは他にもあった。GCS に残っていた古い tfstate（`kabu-news-ai/default.tfstate`）とローカルの state バックアップに、Supabase の3値に加えて Gemini API キー・News API キー・CRON_SECRET が入っていた。どちらも削除済み（Step 11）。

復帰時の入手経路:

| 値 | 復帰手段 |
|---|---|
| `supabase-url` / `anon-key` | 公開値。Supabase Dashboard から取得 |
| `service-role-key` | Supabase Dashboard から取得（#83 は Pause で削除しないため参照可） |
| `slack-webhook-url` | Supabase 側では再発行不可。Slack でアプリ設定から再作成（URL は変わる）。停止後は送信元が無いため **意図的に破棄** |

- [x] `shutdown-archive/` が `.gitignore` 済みであることを確認 — `.gitignore:16`
- [ ] **`web/.env` を削除しない**（`web/.gitignore:38` で除外・git 未追跡）。#82 のリポジトリアーカイブ時、これが事実上唯一の鍵置き場になる
- [ ] `shutdown-archive/`（GSC + Supabase ダンプ）をローカル外へ退避。**認証情報は含まれないため暗号化は必須ではない**

---

## Step 5: 準備中ページを立ち上げてドメインを引き継ぐ

### 前提: Cloud Storage 静的ホスティングは選ばない

独自ドメインで HTTPS を張るには HTTPS ロードバランサが必須で **月18〜25ドル**かかる。
サイト本体より高くつくため、Firebase Hosting（無料枠・独自ドメインの TLS 証明書も無料）を使う。

### Firebase プロジェクトの用意

`ai-product-446711` には Firebase が未有効。**GCP プロジェクトへの Firebase 追加は取り消せない**ため、
共有プロジェクトに使い捨ての Hosting を相乗りさせるのは避け、専用プロジェクトを新規作成する。

```bash
npx -y firebase-tools login
```

```bash
npx -y firebase-tools projects:create money-nav-holding --display-name "money-nav placeholder"
```

### デプロイ

```bash
cd scripts/shutdown/placeholder && npx -y firebase-tools deploy --only hosting --project money-nav-holding
```

- [x] `https://money-nav-holding.web.app` で表示を確認 — 2026-08-17 完了
- [x] 存在しないパス（例 `/glossary`）が **HTTP 404** を返すことを確認 — `/glossary` `/news-articles/*` `/sitemap.xml` すべて 404

> 旧URLをトップへリダイレクトしないこと。数千ページ規模のソフト404はドメイン評価を下げる。
> `404.html` を 404 ステータスで返すのが正しい畳み方。

### カスタムドメイン接続

Firebase コンソール → Hosting → カスタムドメインを追加 → `money-nav.com`

- [x] Firebase が要求する TXT 検証レコードを Cloud DNS に **追加**（既存の `google-site-verification` TXT は消さない。TXT は複数共存できる）— `hosting-site=money-nav-holding`
- [x] Firebase が提示する A レコード値を控える — **`199.36.158.100` の1件のみ**（2件ではない）

必要な値はコンソールから転記せず、API から直接読める。IP の転記ミスはドメインを壊すので、こちらを使う。

```bash
curl -s -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "x-goog-user-project: money-nav-holding" \
  "https://firebasehosting.googleapis.com/v1beta1/projects/money-nav-holding/sites/money-nav-holding/customDomains" | python3 -m json.tool
```

### ダウンタイムを避ける: DNS-01 チャレンジを使う

コンソールは HTTP チャレンジの失敗（`ACME_HTTP_ERROR` / 旧IPが 404 を返す）だけを赤字で表示するが、**API を読むと DNS-01 チャレンジの選択肢が出ている**。これを先に通すと、サイトが Cloud Run で稼働したまま証明書を発行できる。

```bash
gcloud dns record-sets create _acme-challenge.money-nav.com. --type=TXT --ttl=300 --zone=money-nav --project=ai-product-446711 --rrdatas='"<cert.verification.dns.desired の rdata>"'
```

- [x] `cert.state` が `CERT_VALIDATING` → `CERT_PROPAGATING` へ進むことを確認
- 追加直後は Firebase が検知しない。SOA のネガティブキャッシュ TTL（300秒）が切れるまで待つこと

### DNS 切り替え（ここでサイト本体が切り替わる）

**AAAA レコードの削除を忘れないこと。** Firebase Hosting は A(IPv4)のみを提供するため、
既存の AAAA を残すと IPv6 クライアントが死んだ Cloud Run を引き続き参照する。

```bash
gcloud dns record-sets delete money-nav.com. --type=AAAA --zone=money-nav --project=ai-product-446711
```

```bash
gcloud dns record-sets update money-nav.com. --type=A --ttl=300 --zone=money-nav --project=ai-product-446711 --rrdatas=199.36.158.100
```

- [x] TXT の `google-site-verification=hUjT2kk...` が残っていることを再確認
- [x] 証明書が `CERT_ACTIVE` になることを確認 — **DNS-01 で先に発行済みのため、切り替え直後から TLS が通り到達不能な時間は発生しなかった**
- [x] `curl -sI https://money-nav.com` が 200 を返すことを確認
- [x] AAAA が存在しないことを確認

`cert.state` は DNS 切り替え前は `CERT_PROPAGATING` で止まる。`hostState: HOST_MISMATCH` が解消するまで `CERT_ACTIVE` にならないため、**証明書を待ってから切り替えるのではなく、切り替えることで証明書が有効になる**。ここで待ち続けると膠着する。

検証は必ず `--resolve` で Firebase の IP を直指しすること。ローカル DNS キャッシュ（TTL 300秒）が残っていると `curl` は旧 Cloud Run に接続し続け、`/glossary` が 200 を返して切り替え失敗に見える。

```bash
curl -s -o /dev/null -w '%{http_code} %{remote_ip}\n' --resolve money-nav.com:443:199.36.158.100 https://money-nav.com/glossary
```

切り戻し（Cloud Run が生きている #81 実行前まで有効）:

```bash
gcloud dns record-sets update money-nav.com. --type=A --ttl=300 --zone=money-nav --project=ai-product-446711 --rrdatas=216.239.32.21,216.239.34.21,216.239.36.21,216.239.38.21
gcloud dns record-sets create money-nav.com. --type=AAAA --ttl=300 --zone=money-nav --project=ai-product-446711 --rrdatas=2001:4860:4802:32::15,2001:4860:4802:34::15,2001:4860:4802:36::15,2001:4860:4802:38::15
```

`_acme-challenge` TXT は証明書更新に使われる可能性があるため残しておく。

---

## Step 6: GCP リソースを削除（不可逆）

Step 5 の証明書発行完了を待ってから実行する。

```bash
bash scripts/shutdown/03-teardown-gcp.sh
```

まずドライランで削除対象を確認し、問題なければ実行する。

```bash
bash scripts/shutdown/03-teardown-gcp.sh --execute
```

各削除の直前に `assert_not_protected` が走り、対象名が `PROTECTED` の9件のいずれかを**部分文字列として含む**場合はその場で `exit 1` する（#79）。`*** 中断 ***` が出たら、別サービス `ai-product` の資産を消しかけているということなので、名前を疑うこと。`PROTECTED` を緩める判断は最後にする。

削除されるもの（スクリプト内の順序）:

1. Cloud Scheduler 3ジョブ
2. ドメインマッピング `money-nav.com`（Cloud Run 削除より先。逆順だと孤児化してエラーになる）
3. Cloud Run サービス `kabu-news-ai`
4. Artifact Registry `kabu-news-ai`（6.1GB。停止後の残存コストとして最大）
5. Secret Manager 4件
6. `cloud-run-app` の `roles/aiplatform.user` プロジェクトバインディング
7. SA `cloud-run-app` / `api-scheduler` / `github-actions-deploy`
8. WIF プロバイダ `github-provider` + プール `github-actions-pool`

- [x] ドライランの出力を確認 — 8フェーズ・22コマンド・終了コード0
- [x] `--execute` で実行 — 2026-08-18 完了。全22コマンド成功
- [x] `gcloud run services list` に `ai-product` だけが残っていることを確認

### 実行前に確認すべきこと（PROTECTED では守れない範囲）

#79 のガードは**名前の取り違え**には強いが、**依存関係の見落とし**には無力。denylist に書かれていない共用資産は素通りするため、実行前に実利用先を直接確認する。

```bash
for s in ai-product kabu-news-ai; do gcloud run services describe $s --project=ai-product-446711 --region=asia-northeast1 --format='value(spec.template.spec.serviceAccountName)'; done
gcloud iam service-accounts get-iam-policy cloud-run-app@ai-product-446711.iam.gserviceaccount.com --project=ai-product-446711
```

2026-08-18 の実測: `ai-product` → `app-sa`（保護）、`kabu-news-ai` → `cloud-run-app`（削除対象）で分離は完全。`github-actions-deploy` を借用できるのは `github-actions-pool/attribute.repository/Takeshi-005/kabu-news-ai` のみで他リポジトリからの経路なし。

### 実行結果（2026-08-18）

| 確認項目 | 結果 |
|---|---|
| Cloud Run | `ai-product` のみ |
| Artifact Registry | `ai-product` 320.2 MiB のみ（**6.0 GiB 削減**） |
| Service Accounts | `app-sa` / `networking-sa` / `github-actions-gcs-deploy` / `money-nav-gcs` が残存 |
| WIF プール | `my-pool` のみ |
| Scheduler / Secret | 0 件 |
| `money-nav.com` | 200（Firebase 経由）/ `/glossary` 404 |
| Cloud DNS ゾーン `money-nav` | 無傷 |
| GCS バケット | `money-nav` / `ai-product-446711-terraform-state` 残存 |

フェーズ6（IAM バインディング解除）をフェーズ7（SA削除）より前に置いているのは、逆順だと消えた SA を指す `deleted:serviceAccount:...?uid=` がポリシーに残るため。GCP が最大60日で自動的に消すが、先にバインディングを外せばその場で消える。

**この時点で #80 の切り戻し経路は失われた**（Cloud Run が存在しないため A レコードを戻しても復旧しない）。

---

## Step 7: Terraform state を整理

リソースは消えたが state には残っているため、次に `terraform plan` を打つと大量の差分が出る。

```bash
cd terraform && terraform init -backend-config="bucket=ai-product-446711-terraform-state" -backend-config="prefix=kabu-news-ai"
```

> 📝 **実際に操作した state（2026-09-24 に判明）**: ローカルの `.terraform` は 2026-02-19 に prefix なしで初期化されていたため、この Step の `state rm` はバケット直下の `default.tfstate`（本物の state）に対して行われた。上の `init` は記録として残しているが、今は prefix を付けずに `terraform init -backend-config="bucket=ai-product-446711-terraform-state"` とすること。prefix を付けると空の場所を見る。

削除済みリソースを state から除去する（`terraform state rm`。実リソースには触れない）:

```bash
cd terraform && terraform state list
```

除去対象は手打ちせず、保持するものを除外して機械的に生成する。取り違えの余地を残さないため。

```bash
cd terraform && terraform state pull > /tmp/tfstate-backup.json
cd terraform && terraform state list | grep -v "^google_project_service\." | xargs terraform state rm
```

- [x] `google_project_service.apis` / `google_project_service.iamcredentials` は **state に残す**（実 API は生きているため）
- [x] それ以外の kabu-news-ai リソースを `terraform state rm` で除去 — 2026-08-18 完了。26件除去・9件保持
- [x] `terraform plan` が「作成のみ」の差分になる（= 消えたことが state に反映済み）ことを確認 — `Plan: 26 to add, 0 to change, 0 to destroy`

意味があるのは **`0 to destroy`**。state が「これらのリソースは存在しない」を正しく認識した証拠になる。

`26 to add` が残るのは `.tf` の宣言をそのままにしているため。**誰かが `apply` すると作り直しが始まる**（新しく作られる Artifact Registry は空でイメージがないため Cloud Run の作成で失敗し、途中まで作られた状態で止まる）。Step 8 のアーカイブによる read-only 化が実質的な安全装置になる。

---

## Step 8: GitHub リポジトリをアーカイブ（**全工程の最後に行う**）

WIF プールを消した時点で `deploy.yml` は認証に失敗するようになる。デプロイ経路を使い終わってから行う。

### ⚠️ アーカイブは Step 10 の後

アーカイブすると **PR のマージも issue のクローズもできなくなる**（read-only 化）。
当初この Step は #82 に含まれていたが、それでは **#82 自身をクローズできない**。
未マージ PR・未クローズ issue をすべて片付けてから、最後の操作として実行すること。

正しい順序:

```
Step 7（state整理）→ ワークフロー無効化 → Secrets削除 → README更新 → PRマージ
→ Step 9（Supabase Pause）→ Step 10（残件）→ 全issueクローズ → アーカイブ
```

- [ ] `deploy.yml` を disable（`gh workflow disable deploy.yml`）
- [ ] リポジトリ Secrets を削除（`GCP_PROJECT_NUMBER` / `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`）。値は `web/.env` にあるので失われない
- [ ] README.md に提供終了を追記（**アーカイブ後は編集できないため必ず先に**）
- [ ] 未マージ PR がゼロであることを確認（`gh pr list`）
- [ ] shutdown ラベルの issue がすべてクローズ済みであることを確認
- [ ] アーカイブ実行

```bash
gh repo archive Takeshi-005/kabu-news-ai
```

---

## Step 9: Supabase を Pause

Dashboard → Project Settings → General → Pause project

- [x] Step 3 のダンプが完了していることを再確認 — 22テーブル・1,878行。Drive へ外部コピー済み
- [x] Pause 実行（**削除はしない**。Pause は復元可能）— 2026-08-18 完了

検証は DNS で行う。Pause するとプロジェクトの API エンドポイントごと DNS レコードが消えるため、名前解決の失敗が停止の証拠になる。

```bash
dig +short ykydeknqirisfppmhhrs.supabase.co @8.8.8.8   # 応答なし = Pause 済み
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" --max-time 20 https://supabase.com  # 対照
```

必ず対照テストを併せて行うこと。「繋がらない」がローカルのネットワーク障害である可能性を排除できない。所要時間が 0.001 秒台ならタイムアウトではなく DNS 解決失敗で、Pause と整合する。

Supabase は今後**別プロジェクトを新規作成**して次のアプリに使う方針（2026-08-18 決定）。無料枠はアクティブなプロジェクト2つまでのため、`ykydeknqirisfppmhhrs` を Pause して枠を空けておく。

同じプロジェクトを流用する方針だった場合は Pause せず、旧22テーブルの削除マイグレーションを作る流れになる。判断が正反対になるので混同しないこと。

---

## Step 10: 残件の確認

- [x] Stripe 等の課金連携 — 本リポジトリには実装なし。**スキップ**
- [x] X アカウント `@AI990132664209` — **対応不要と判断**（2026-08-18）
- [x] お問い合わせフォーム (`forms.gle/Ki1LzdMACCF4nMeP6`) — **参照を全削除**（2026-08-18 方針変更）。準備中ページのフッターと `shared/config/brand.ts` の `CONTACT_FORM_URL`、`(legal)/about` の行を削除済み。Google Form 本体は Google 側で別途クローズすること
- [x] OAuth クライアント — **`ai-product` との共有なしを確認**（2026-08-18）
- [x] ドメイン `money-nav.com` — **維持**。次プロダクトで再利用する
- [x] Cloud DNS ゾーン `money-nav` — 維持（月$0.20程度）
- [x] GitHub リポジトリ Secrets 4件 — 削除済み（GCP Secret Manager とは別枠。#81 では消えない）
- [x] GA4 `471603108` / GSC `sc-domain:money-nav.com` — 維持。TXT が残っていれば所有権は切れない

### OAuth クライアントの帰属判定

`redirect_uris` を見れば所属が一意に決まる。クライアントIDだけでは分からない。

```
redirect_uris: https://ykydeknqirisfppmhhrs.supabase.co/auth/v1/callback
```

マネイッポの Supabase 認証コールバック専用 = `ai-product` は使えない。よって削除して問題ない。
ただし無料であり、削除は必須ではない。ローカルの `client_secret_*.json` はリポジトリ内から参照ゼロ（`.gitignore:13` で除外済み）。

### GitHub の「シークレット」は3系統ある

`gh secret list` だけでは足りない。停止時は3つとも空を確認すること。

```bash
gh secret list && gh variable list && gh secret list --app dependabot
```

---

## Step 11: 古い state の削除と鍵の失効（2026-09-24 追加）

停止後の文書レビューで、state が2か所にあることが分かった。

| オブジェクト | 内容 | 対応 |
|---|---|---|
| `default.tfstate`（バケット直下） | 本物の state（serial 42、2026-08-18 更新）。`google_project_service` 9件だけで、シークレットは入っていない | 残す |
| `kabu-news-ai/default.tfstate` | 2026-02-11 で止まった古い state（serial 14、同じ lineage）。**シークレット6件が平文**（supabase-url / anon-key / service-role-key、gemini-api-key、news-api-key、cron-secret） | 2026-09-24 削除 |
| `kabu-news-ai/default.tflock` | 2026-07-02 にキャンセルされた CI の plan が残したロック | 2026-09-24 削除 |
| ローカルの `terraform/terraform.tfstate.backup.20260202_093115` | 同じ値のうち5件が平文（gitignore 済み・未コミット） | 2026-09-24 削除 |

原因は、2026-02-19 にローカルで prefix を付けずに `terraform init` したこと。GCS backend の `prefix` は省略でき、省略してもエラーにならずバケット直下が使われる。以降の apply と Step 7 はすべて直下の state に書かれ、文書と CI（`terraform-plan.yml`）が指す prefix 側には古い state が残り続けた。

古い state は、プロジェクトの Owner と、プロジェクト全体に `roles/storage.objectAdmin` を持つ SA `money-nav-gcs` が読める状態だった。削除したオブジェクトは、バケットのソフト削除によって7日間は復元できる。

```bash
gcloud storage ls gs://ai-product-446711-terraform-state/   # default.tfstate だけが残っていること
```

- [x] 古い state・残留ロック・ローカルのバックアップを削除 — 2026-09-24
- [ ] Gemini API キー（AI Studio で発行したもの）を削除する。まだ有効なら、悪用されると課金される
- [ ] News API キーを再発行する
- [ ] Supabase の service role key は、プロジェクトを再開する場合にローテーションする（Pause 中は優先度低）
- CRON_SECRET は本番では使っていない（本番の cron は OIDC）。ローカルの `/api/test/*` でも同じ値を使っているなら、`web/.env` の値を作り直す

---

## 回収の実績（2026-08-18 時点）

| 対象 | 停止前 | 停止後 |
|------|--------|--------|
| Artifact Registry | `kabu-news-ai` 6.0 GiB | 削除（`ai-product` 320 MiB のみ） |
| Cloud Run | `kabu-news-ai` 稼働 | 削除 |
| Cloud Scheduler | 3ジョブ（日次 Gemini 呼び出し含む） | 0ジョブ |
| Secret Manager | 4件 | 0件 |
| サービスアカウント | 7件 | 4件（すべて `ai-product` 系） |
| WIF プール | 2件 | 1件（`my-pool`） |
| Supabase | アクティブ | PAUSED |
| 維持するもの | — | ドメイン `money-nav.com` / DNSゾーン `money-nav`（月$0.20程度）/ Firebase Hosting（無料枠）/ GA4 / GSC |

**変動費の本体だった日次 `prediction-generator` の Gemini 呼び出しが停止**したことが最大の効果。実際の請求額は gcloud から取得できないため、GCP Console の請求レポートで 2026-08 と 2026-09 を比較して確認すること。

## この停止で何を学んだかの記録

流入ゼロという結果自体は失敗ではなく、次の方向転換の根拠になった実測データである。

- 投資学習という **大手とコンテンツ量で殴り合う市場** を個人で取りにいくと、権威性で届かない
- インデックス率15%・チャネルゼロという数字が「良いコンテンツを積めば届く」という前提を否定した
- その結論があるから、次は **狭くて自分にしか作れない領域**（税務の過年度修正）に振れている

判断の順番としては正しい学習をしている。この記録を消さないこと。
