-- ============================================
-- Migration: 029_add_key_concept
-- Description: 適時開示判定に「今日学べる概念」を保持する key_concept カラムを追加。
--              初心者向け学習サービスとして「他の銘柄にも応用できる読み方」を1行で持つ。
-- Created: 2026-06-06
-- ============================================

ALTER TABLE public.stock_impact_analyses
  ADD COLUMN IF NOT EXISTS key_concept VARCHAR(100);

COMMENT ON COLUMN public.stock_impact_analyses.key_concept IS
  '初心者が他の銘柄にも応用できる1行の汎用概念（disclosure 由来のみ使用）';
