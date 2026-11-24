-- ============================================
-- Migration: 002_limit_move_reports
-- Description: ストップ高レポートを保存するテーブル
-- Created: 2026-01-14
-- ============================================

-- テーブル作成
CREATE TABLE public.limit_move_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,           -- レポート日付（1日1レポート）
  catchphrase TEXT NOT NULL,           -- 全体のキャッチコピー
  stocks JSONB NOT NULL,               -- 銘柄分析結果（配列）
  created_at TIMESTAMPTZ DEFAULT now() -- 作成日時
);

-- コメント
COMMENT ON TABLE public.limit_move_reports IS 'ストップ高銘柄のAI分析レポート';
COMMENT ON COLUMN public.limit_move_reports.date IS 'レポート対象日（ユニーク）';
COMMENT ON COLUMN public.limit_move_reports.catchphrase IS '全体のキャッチコピー（25文字以内）';
COMMENT ON COLUMN public.limit_move_reports.stocks IS '銘柄ごとの分析結果（JSONB配列）';

-- インデックス
CREATE INDEX idx_limit_move_reports_date
  ON public.limit_move_reports(date DESC);

-- RLS（Row Level Security）有効化
ALTER TABLE public.limit_move_reports ENABLE ROW LEVEL SECURITY;

-- ポリシー: 読み取りは全員可能
CREATE POLICY "Anyone can read limit_move_reports"
  ON public.limit_move_reports
  FOR SELECT
  USING (true);

-- ポリシー: 書き込みはサービスロール（admin）のみ
CREATE POLICY "Service role can insert limit_move_reports"
  ON public.limit_move_reports
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update limit_move_reports"
  ON public.limit_move_reports
  FOR UPDATE
  USING (true);

-- ============================================
-- stocks カラムの構造（参考）
-- ============================================
-- [
--   {
--     "code": "7203",
--     "name": "トヨタ自動車",
--     "fact": "EV新型車を発表",
--     "simpleReason": "夢が広がった",
--     "riskRank": 2,
--     "riskLabel": "検討余地あり",
--     "changePercent": 15.5
--   },
--   ...
-- ]
