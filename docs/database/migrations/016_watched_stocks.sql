-- 注目銘柄テーブル（管理者が Supabase ダッシュボードで管理）
CREATE TABLE watched_stocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker_code  VARCHAR(10) NOT NULL UNIQUE,
  company_name VARCHAR(100) NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 銘柄影響分析テーブル（Cron で日次生成、全ユーザー共通）
CREATE TABLE stock_impact_analyses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date             DATE NOT NULL,
  ticker_code      VARCHAR(10) NOT NULL,
  impact           VARCHAR(10) NOT NULL CHECK (impact IN ('positive', 'negative', 'neutral')),
  magnitude        VARCHAR(10) NOT NULL CHECK (magnitude IN ('large', 'medium', 'small')),
  reason           TEXT NOT NULL,
  educational_note TEXT,
  relevance_score  NUMERIC(3, 2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, ticker_code)
);

CREATE INDEX idx_stock_impact_analyses_date ON stock_impact_analyses (date);
