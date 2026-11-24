-- Migration: 032_roadmap_self_report
-- Description: 投資家成長ロードマップ(#19)の自己申告フラグ(口座開設・初購入)を profiles に追加
-- Created: 2026-06-28

alter table public.profiles
  add column if not exists account_opened_at timestamptz,
  add column if not exists first_purchase_at timestamptz;

comment on column public.profiles.account_opened_at is 'ロードマップ④: 証券口座開設を自己申告した日時';
comment on column public.profiles.first_purchase_at is 'ロードマップ⑤: 初めての1株購入を自己申告した日時';
