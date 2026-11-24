-- AI生成の可観測性テーブルとis_publishedキルスイッチ

-- ============================================
-- 1. daily_quizzes に is_published カラム追加
-- ============================================
ALTER TABLE public.daily_quizzes
  ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX idx_daily_quizzes_published
  ON public.daily_quizzes (date DESC)
  WHERE is_published = true;

COMMENT ON COLUMN public.daily_quizzes.is_published
  IS 'false にすると当日クイズをユーザーから非表示にできるキルスイッチ';

-- ============================================
-- 2. quiz_cache に is_published カラム追加
-- ============================================
ALTER TABLE public.quiz_cache
  ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT true;

-- ============================================
-- 3. ai_generations テーブル
-- ============================================
CREATE TABLE public.ai_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_date DATE NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'quiz'
    CHECK (content_type IN ('quiz', 'news_article', 'market_analysis', 'weekly_review', 'limit_move')),
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  prompt_version TEXT NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  model TEXT NOT NULL,
  input_context JSONB NOT NULL,
  output_content JSONB,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'retried')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.ai_generations
  USING (false)
  WITH CHECK (false);

CREATE INDEX idx_ai_generations_date
  ON public.ai_generations (generation_date DESC);

CREATE INDEX idx_ai_generations_content_type
  ON public.ai_generations (content_type, generation_date DESC);

CREATE INDEX idx_ai_generations_status
  ON public.ai_generations (status, generation_date DESC);

COMMENT ON TABLE public.ai_generations
  IS 'AI生成の各試行を記録。attempt_number>1 はフィードバック付きリトライ';

-- ============================================
-- 4. ai_evaluations テーブル
-- ============================================
CREATE TABLE public.ai_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID NOT NULL REFERENCES public.ai_generations(id) ON DELETE CASCADE,
  evaluator_model TEXT NOT NULL,
  is_valid BOOLEAN NOT NULL,
  scores JSONB NOT NULL,
  error_type TEXT NOT NULL,
  feedback_for_retry TEXT,
  failing_quiz_indices INTEGER[],
  thought TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.ai_evaluations
  USING (false)
  WITH CHECK (false);

CREATE INDEX idx_ai_evaluations_generation
  ON public.ai_evaluations (generation_id);

CREATE INDEX idx_ai_evaluations_valid
  ON public.ai_evaluations (is_valid, created_at DESC);

COMMENT ON TABLE public.ai_evaluations
  IS 'LLM-as-a-Judgeの評価結果。generation_idでai_generationsと紐付け';

-- ============================================
-- 5. バッチコンテンツテーブルへ is_published 追加
-- ============================================
ALTER TABLE public.news_articles
  ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.market_analyses
  ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.weekly_reviews
  ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX idx_news_articles_published
  ON public.news_articles (date DESC) WHERE is_published = true;

CREATE INDEX idx_market_analyses_published
  ON public.market_analyses (date DESC) WHERE is_published = true;

CREATE INDEX idx_weekly_reviews_published
  ON public.weekly_reviews (week_start DESC) WHERE is_published = true;
