-- 予測トレーニング機能
-- 毎日の予測問題 + 実際の市場結果
CREATE TABLE prediction_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  question TEXT,
  context_summary TEXT,
  actual_movement VARCHAR(4) CHECK (actual_movement IN ('up', 'down')),
  baseline_price DECIMAL(12,2),
  close_price DECIMAL(12,2),
  price_change_pct DECIMAL(8,4),
  explanation TEXT,
  is_revealed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prediction_results_date ON prediction_results (date DESC);

-- ユーザーの予測回答（1日1回）
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL REFERENCES prediction_results(date),
  prediction VARCHAR(4) NOT NULL CHECK (prediction IN ('up', 'down')),
  is_correct BOOLEAN,
  pnl DECIMAL(8,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_predictions_user_id ON predictions (user_id);
CREATE INDEX idx_predictions_date ON predictions (date DESC);

-- ユーザーパフォーマンスキャッシュ（毎朝 cron が更新）
CREATE TABLE user_performance (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_predictions INT NOT NULL DEFAULT 0,
  correct_predictions INT NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  total_pnl DECIMAL(12,4) NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  max_streak INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
