-- 週間マーケットレビューテーブル
CREATE TABLE weekly_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start date NOT NULL UNIQUE,
  week_end date NOT NULL,
  content jsonb NOT NULL,
  nikkei_start numeric,
  nikkei_end numeric,
  nikkei_change_percent numeric,
  created_at timestamptz DEFAULT now()
);

-- RLS有効化（公開読み取り）
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_reviews_public_read"
  ON weekly_reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX idx_weekly_reviews_week_start ON weekly_reviews (week_start DESC);
