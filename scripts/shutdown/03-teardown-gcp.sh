#!/usr/bin/env bash
#
# kabu-news-ai (マネイッポ) の GCP リソースを削除するスクリプト。
#
# このプロジェクトは別サービス ai-product と GCP プロジェクトを共有しているため、
# 「消してよいものを列挙する」のではなく「絶対に触らないものと照合して弾く」方式をとる。
# 名前の類似による誤削除（kabu-news-ai と ai-product、github-actions-pool と my-pool）を
# 構造的に防ぐのが目的。
#
# 既定はドライラン。実行するには --execute を渡す。
#   bash scripts/shutdown/03-teardown-gcp.sh            # 表示のみ
#   bash scripts/shutdown/03-teardown-gcp.sh --execute  # 実削除
#
# 事前条件（docs/shutdown/SHUTDOWN_CHECKLIST.md の Step 1-3 を先に完了させること）:
#   - GSC / Supabase の退避が完了している
#   - Secret Manager の値を退避済み
#   - 準備中ページが money-nav.com を引き取れる状態になっている

set -euo pipefail

PROJECT_ID="ai-product-446711"
REGION="asia-northeast1"
SERVICE="kabu-news-ai"
DOMAIN="money-nav.com"

# 同一プロジェクトに同居する別サービスの資産。ここに一致する名前は削除対象にしない。
PROTECTED=(
  "ai-product"                        # 別サービスの Cloud Run / Artifact Registry
  "my-pool"                           # 別リポジトリ用 WIF プール
  "github-actions-oidc"               # 別リポジトリ用 WIF プロバイダ
  "app-sa"                            # 別サービスの SA
  "networking-sa"
  "github-actions-gcs-deploy"
  "money-nav-gcs"
  "ai-product-446711-terraform-state" # Terraform state（kabu-news-ai の state はバケット直下。共有プロジェクトの資産として保護）
  "money-nav"                         # Cloud DNS ゾーン兼 GCS バケット（維持する）
)

EXECUTE=0
[[ "${1:-}" == "--execute" ]] && EXECUTE=1

# 完全一致ではなく部分一致で弾く。`ai-product-446711` のように保護名を含む名前を取りこぼさないため。
# 止まりすぎは PROTECTED を直せば再開できるが、通しすぎは別サービスが消えてから気づくので厳しい側に倒す。
assert_not_protected() {
  local target="$1"
  local kind="${2:-resource}"
  local protected

  for protected in "${PROTECTED[@]}"; do
    if [[ "$target" == *"$protected"* ]]; then
      echo >&2
      echo "*** 中断 *** ${kind} \"${target}\" が保護対象 \"${protected}\" に該当します。" >&2
      echo "同一プロジェクトに同居する別サービス ai-product の資産のため削除しません。" >&2
      echo "意図した削除であれば PROTECTED 配列を見直してください。" >&2
      exit 1
    fi
  done
}

run() {
  echo "  \$ $*"
  if [[ $EXECUTE -eq 1 ]]; then
    "$@"
  fi
}

phase() {
  echo
  echo "── $* ─────────────────────────────"
}

if [[ $EXECUTE -eq 0 ]]; then
  echo "*** DRY RUN *** 実行するには --execute を渡してください"
else
  echo "*** 実削除モード *** project=${PROJECT_ID}"
  read -r -p "本当に ${SERVICE} 関連リソースを削除しますか? [yes/N] " answer
  [[ "$answer" == "yes" ]] || { echo "中止しました"; exit 1; }
fi

phase "1. Cloud Scheduler ジョブを停止・削除"
for job in prediction-generator glossary-generator seo-data-collector; do
  assert_not_protected "$job" "scheduler job"
  run gcloud scheduler jobs pause "$job" \
    --project="$PROJECT_ID" --location="$REGION" --quiet
  run gcloud scheduler jobs delete "$job" \
    --project="$PROJECT_ID" --location="$REGION" --quiet
done

phase "2. ドメインマッピングを解除（Cloud Run 削除より先に行う）"
assert_not_protected "$SERVICE" "domain mapping"
run gcloud beta run domain-mappings delete \
  --domain="$DOMAIN" --project="$PROJECT_ID" --region="$REGION" --quiet

phase "3. Cloud Run サービスを削除"
assert_not_protected "$SERVICE" "cloud run service"
run gcloud run services delete "$SERVICE" \
  --project="$PROJECT_ID" --region="$REGION" --quiet

phase "4. Artifact Registry リポジトリを削除（約6.1GB / 残存コスト最大）"
assert_not_protected "$SERVICE" "artifact registry repository"
run gcloud artifacts repositories delete "$SERVICE" \
  --project="$PROJECT_ID" --location="$REGION" --quiet

phase "5. Secret Manager のシークレットを削除（値は web/.env と Supabase Dashboard から復帰可能。#78 で退避不要と判断済み）"
for secret in supabase-url supabase-anon-key supabase-service-role-key slack-webhook-url; do
  assert_not_protected "$secret" "secret"
  run gcloud secrets delete "$secret" --project="$PROJECT_ID" --quiet
done

phase "6. プロジェクトレベルの IAM バインディングを解除"
run gcloud projects remove-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:cloud-run-app@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user" --quiet

phase "7. サービスアカウントを削除"
for sa in cloud-run-app api-scheduler github-actions-deploy; do
  assert_not_protected "$sa" "service account"
  run gcloud iam service-accounts delete \
    "${sa}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --project="$PROJECT_ID" --quiet
done

phase "8. Workload Identity（github-actions-pool は本リポジトリ専用）"
assert_not_protected "github-provider" "wif provider"
run gcloud iam workload-identity-pools providers delete github-provider \
  --workload-identity-pool=github-actions-pool \
  --location=global --project="$PROJECT_ID" --quiet
assert_not_protected "github-actions-pool" "wif pool"
run gcloud iam workload-identity-pools delete github-actions-pool \
  --location=global --project="$PROJECT_ID" --quiet

echo
echo "── 意図的に削除しないもの ─────────────────────────────"
cat <<'KEEP'
  - GCP プロジェクト ai-product-446711 自体（ai-product が同居）
  - 有効化済み API 群（ai-product が使用中。terraform も disable_on_destroy=false）
  - Cloud DNS ゾーン money-nav
      TXT の google-site-verification が Search Console のドメインプロパティ認証を
      支えているため、削除すると過去データの参照権を失う
  - GCS バケット money-nav（92KB / stocks・reports の JSON。別系統の資産）
  - GCS バケット ai-product-446711-terraform-state
  - WIF プール my-pool とそのプロバイダ github-actions-oidc
KEEP

echo
if [[ $EXECUTE -eq 0 ]]; then
  echo "ドライラン完了。実行するには --execute を渡してください。"
else
  echo "削除完了。Terraform state に差分が残るため、後続で state から除去すること:"
  echo "  docs/shutdown/SHUTDOWN_CHECKLIST.md の Step 7 を参照"
fi
