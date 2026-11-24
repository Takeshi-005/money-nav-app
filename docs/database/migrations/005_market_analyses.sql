-- ============================================
-- Migration: 005_market_analyses
-- Description: 日経平均下落解説テーブル
-- Created: 2026-01-29
-- ============================================

-- テーブル作成
CREATE TABLE public.market_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,                   -- 解説日付（1日1解説）
  nikkei_close DECIMAL(10, 2) NOT NULL,        -- 日経平均終値
  nikkei_change_percent DECIMAL(5, 2) NOT NULL,-- 前日比変動率（%）
  analysis_content JSONB NOT NULL,             -- 解説コンテンツ
  created_at TIMESTAMPTZ DEFAULT now()         -- 作成日時
);

-- コメント
COMMENT ON TABLE public.market_analyses IS '日経平均下落時のAI解説';
COMMENT ON COLUMN public.market_analyses.date IS '解説対象日（ユニーク）';
COMMENT ON COLUMN public.market_analyses.nikkei_close IS '日経平均終値';
COMMENT ON COLUMN public.market_analyses.nikkei_change_percent IS '前日比変動率（マイナス値で下落）';
COMMENT ON COLUMN public.market_analyses.analysis_content IS '解説内容（JSONB: summary, factors, checklist, scenarios, beginnerAdvice, sectorAnalysis）';

-- インデックス
CREATE INDEX idx_market_analyses_date
  ON public.market_analyses(date DESC);

-- RLS（Row Level Security）有効化
ALTER TABLE public.market_analyses ENABLE ROW LEVEL SECURITY;

-- ポリシー: 読み取りは全員可能
CREATE POLICY "Anyone can read market_analyses"
  ON public.market_analyses
  FOR SELECT
  USING (true);

-- ポリシー: 書き込みはサービスロール（admin）のみ
CREATE POLICY "Service role can insert market_analyses"
  ON public.market_analyses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update market_analyses"
  ON public.market_analyses
  FOR UPDATE
  USING (true);

-- ============================================
-- analysis_content カラムの構造（参考）
-- ============================================
-- {
--   "summary": "米国株安と円高で日経平均が急落。テック株中心に売られました。",
--   "factors": [
--     {
--       "category": "us_market",
--       "title": "米国株の急落",
--       "description": "S&P500が前日比-2.5%と大幅下落。特にハイテク株が売られました。"
--     },
--     {
--       "category": "forex",
--       "title": "急激な円高",
--       "description": "1ドル=145円から140円へ。輸出企業の業績懸念が広がりました。"
--     }
--   ],
--   "checklist": [
--     {
--       "question": "下落の原因は一時的なものか、構造的なものか？",
--       "guidance": "今回の下落は米国の利上げ観測という一時的な要因が中心です。",
--       "isWarningSign": false
--     }
--   ],
--   "scenarios": {
--     "bullish": {
--       "title": "反発シナリオ",
--       "description": "利上げ観測が後退すれば、株価は回復する可能性があります。",
--       "conditions": [
--         "米国のインフレ率が低下",
--         "FRBがハト派姿勢に転換",
--         "為替が安定"
--       ]
--     },
--     "bearish": {
--       "title": "続落シナリオ",
--       "description": "利上げが長期化すれば、さらなる下落リスクがあります。",
--       "conditions": [
--         "インフレ率が高止まり",
--         "FRBがタカ派姿勢を継続",
--         "企業業績が悪化"
--       ]
--     }
--   },
--   "beginnerAdvice": {
--     "dos": [
--       "冷静に状況を観察しましょう",
--       "長期投資の視点を持ちましょう",
--       "分散投資を心がけましょう"
--     ],
--     "donts": [
--       "パニック売りをしない",
--       "借金で投資しない",
--       "感情的に判断しない"
--     ]
--   },
--   "sectorAnalysis": [
--     {
--       "sector": "テクノロジー",
--       "impact": "negative",
--       "description": "円高で輸出企業の業績懸念が広がりました"
--     }
--   ]
-- }
