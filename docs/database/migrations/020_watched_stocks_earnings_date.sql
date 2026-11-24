-- watched_stocks に次回決算発表予定日を保持するカラムを追加
-- 影響分析プロンプトで分析日 ±7日以内のときに注釈として AI に渡す

ALTER TABLE watched_stocks
  ADD COLUMN next_earnings_date DATE;

COMMENT ON COLUMN watched_stocks.next_earnings_date IS '次回決算発表予定日。発表後は管理画面で次の発表日に更新する';
