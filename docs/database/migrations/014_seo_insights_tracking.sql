-- SEOインサイト施策効果追跡カラム追加

ALTER TABLE seo_insights
  ADD COLUMN baseline_metrics jsonb,
  ADD COLUMN action_taken text,
  ADD COLUMN action_completed_at timestamptz,
  ADD COLUMN followup_metrics jsonb,
  ADD COLUMN followup_at date,
  ADD COLUMN improvement_summary text;

CREATE INDEX idx_seo_insights_followup
  ON seo_insights (status, action_completed_at)
  WHERE status = 'completed' AND action_completed_at IS NOT NULL;
