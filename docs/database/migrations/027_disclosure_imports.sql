-- ============================================
-- Migration: 027_disclosure_imports
-- Description: 適時開示記事（kabutan等）の手動取り込み機能。claude.ai 出力JSONをそのまま保存する。
--              既存 stock_impact_analyses に source/disclosure_event_id カラムを追加して
--              news 由来判定と disclosure 由来判定を独立保持できるようにする。
-- Created: 2026-06-02
-- ============================================

-- 1) 取り込み単位（1記事=1行）
CREATE TABLE public.disclosure_imports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        VARCHAR(20) NOT NULL CHECK (source IN ('kabutan_manual')),
  source_url    TEXT,
  article_date  DATE NOT NULL,
  raw_json      TEXT NOT NULL,
  text_hash     VARCHAR(64) NOT NULL UNIQUE,
  imported_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.disclosure_imports IS '管理者が claude.ai で構造化した記事JSONを取り込む単位';
COMMENT ON COLUMN public.disclosure_imports.source IS '取り込み元（現状は kabutan_manual のみ、将来拡張用）';
COMMENT ON COLUMN public.disclosure_imports.article_date IS '記事の対象日';
COMMENT ON COLUMN public.disclosure_imports.raw_json IS 'admin が貼り付けた生JSON。再処理用に保存';
COMMENT ON COLUMN public.disclosure_imports.text_hash IS 'raw_json の SHA-256。同一JSONの重複登録を防ぐ';

CREATE INDEX idx_disclosure_imports_article_date
  ON public.disclosure_imports (article_date DESC);

-- 2) 抽出された個別開示（1記事 N行、watched_stocks 未登録銘柄も保存する）
CREATE TABLE public.disclosure_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disclosure_import_id  UUID NOT NULL REFERENCES public.disclosure_imports(id) ON DELETE CASCADE,
  ticker_code           VARCHAR(10) NOT NULL,
  company_name          VARCHAR(100) NOT NULL,
  disclosure_type       VARCHAR(30) NOT NULL CHECK (disclosure_type IN (
    'clinical_trial_success',
    'upward_revision',
    'downward_revision',
    'share_buyback',
    'dividend_increase',
    'm_and_a',
    'business_alliance',
    'large_order',
    'regulatory',
    'other'
  )),
  summary               TEXT NOT NULL,
  raw_segment           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.disclosure_events IS '記事から抽出した個別開示。watched_stocks 未登録銘柄も保存（kabutanキュレーションの全件保存）';

CREATE INDEX idx_disclosure_events_import_ticker
  ON public.disclosure_events (disclosure_import_id, ticker_code);

CREATE INDEX idx_disclosure_events_ticker
  ON public.disclosure_events (ticker_code);

-- 3) stock_impact_analyses の改修：source カラム + UNIQUE 変更
ALTER TABLE public.stock_impact_analyses
  ADD COLUMN source              VARCHAR(20),
  ADD COLUMN disclosure_event_id UUID REFERENCES public.disclosure_events(id) ON DELETE SET NULL;

UPDATE public.stock_impact_analyses
  SET source = 'news'
  WHERE source IS NULL;

ALTER TABLE public.stock_impact_analyses
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN source SET DEFAULT 'news',
  ADD CONSTRAINT stock_impact_analyses_source_check
    CHECK (source IN ('news', 'disclosure'));

-- 旧UNIQUE制約を外して source 込みに張り直す
ALTER TABLE public.stock_impact_analyses
  DROP CONSTRAINT stock_impact_analyses_date_ticker_code_key;

ALTER TABLE public.stock_impact_analyses
  ADD CONSTRAINT stock_impact_analyses_date_ticker_source_key
    UNIQUE (date, ticker_code, source);

COMMENT ON COLUMN public.stock_impact_analyses.source IS 'news=ニュース由来日次バッチ、disclosure=適時開示由来手動取り込み';
COMMENT ON COLUMN public.stock_impact_analyses.disclosure_event_id IS 'source=disclosure の場合に紐づく開示イベント';

CREATE INDEX idx_stock_impact_analyses_disclosure_event
  ON public.stock_impact_analyses (disclosure_event_id)
  WHERE disclosure_event_id IS NOT NULL;

-- 4) RLS（管理者専用のため、サービスロール経由のみ許可）
ALTER TABLE public.disclosure_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disclosure_events  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage disclosure_imports"
  ON public.disclosure_imports
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage disclosure_events"
  ON public.disclosure_events
  FOR ALL
  USING (true)
  WITH CHECK (true);
