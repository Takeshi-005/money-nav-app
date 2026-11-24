-- SEO分析用テーブル群

-- Search Console クエリ別パフォーマンス
CREATE TABLE seo_search_performance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collected_at date NOT NULL,
  date_range_start date NOT NULL,
  date_range_end date NOT NULL,
  query text NOT NULL,
  page text NOT NULL,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  position numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(collected_at, query, page)
);

ALTER TABLE seo_search_performance ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_seo_search_perf_collected ON seo_search_performance (collected_at DESC);
CREATE INDEX idx_seo_search_perf_query ON seo_search_performance (query);

-- GA4 ページ別パフォーマンス
CREATE TABLE seo_page_performance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collected_at date NOT NULL,
  date_range_start date NOT NULL,
  date_range_end date NOT NULL,
  page_path text NOT NULL,
  page_views integer NOT NULL DEFAULT 0,
  unique_users integer NOT NULL DEFAULT 0,
  avg_engagement_time numeric NOT NULL DEFAULT 0,
  bounce_rate numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(collected_at, page_path)
);

ALTER TABLE seo_page_performance ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_seo_page_perf_collected ON seo_page_performance (collected_at DESC);
CREATE INDEX idx_seo_page_perf_path ON seo_page_performance (page_path);

-- SEOインサイト（分析結果）
CREATE TABLE seo_insights (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collected_at date NOT NULL,
  insight_type text NOT NULL CHECK (insight_type IN ('low_ctr', 'position_improvement', 'content_gap', 'top_performer')),
  priority integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text NOT NULL,
  target_query text,
  target_page text,
  current_metrics jsonb,
  suggested_action text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seo_insights ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_seo_insights_collected ON seo_insights (collected_at DESC);
CREATE INDEX idx_seo_insights_type ON seo_insights (insight_type);
CREATE INDEX idx_seo_insights_status ON seo_insights (status);
