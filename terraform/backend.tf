# backend.tf - Terraform State Backend Configuration
#
# Backend設定は terraform init -backend-config で動的に指定します
# 初期化方法:
#   terraform init -backend-config="bucket=${PROJECT_ID}-terraform-state"
#
# 注意: 本構成の state は 2026-02-19 以降、バケット直下（prefix なし）の default.tfstate にある。
# prefix=kabu-news-ai を付けると別の（空の）場所を見る
#
# リモートState用バケットは事前に作成が必要:
# gcloud storage buckets create gs://PROJECT_ID-terraform-state \
#     --location=asia-northeast1 \
#     --uniform-bucket-level-access

terraform {
  backend "gcs" {
    # bucket と prefix は terraform init -backend-config で指定
  }
}
