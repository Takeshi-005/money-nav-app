-- ============================================
-- Migration: 033_add_social_summary
-- Description: 適時開示判定に SNS(X) 発信用の要約 social_summary カラムを追加。
--              添付記事の表現を使わず、株価予測・助言を含まない 150〜250字の学習フックとして持つ。
-- Created: 2026-07-06
-- ============================================

ALTER TABLE public.stock_impact_analyses
  ADD COLUMN IF NOT EXISTS social_summary TEXT;

COMMENT ON COLUMN public.stock_impact_analyses.social_summary IS
  'X等のSNS発信用の要約（150〜250字、disclosure 由来のみ使用・非予測/非助言）';
