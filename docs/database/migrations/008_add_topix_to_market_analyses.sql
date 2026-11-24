-- TOPIXデータをmarket_analysesテーブルに追加
-- マイグレーション実行日: 2026-02-11
-- 目的: 日経平均に加えてTOPIXデータを追加し、より包括的な市場分析を提供

ALTER TABLE public.market_analyses
ADD COLUMN topix_close DECIMAL(10, 2),
ADD COLUMN topix_change_percent DECIMAL(5, 2);

COMMENT ON COLUMN public.market_analyses.topix_close IS 'TOPIX終値';
COMMENT ON COLUMN public.market_analyses.topix_change_percent IS 'TOPIX前日比変動率（%）';
