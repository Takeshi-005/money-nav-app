-- ============================================
-- Migration: 010_diagnosis_cache
-- Description: 投資スタイル診断の回答パターンキャッシュ
-- Created: 2026-02-24
-- ============================================

CREATE TABLE public.diagnosis_cache (
  answer_key TEXT PRIMARY KEY,
  ai_result  JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- コメント
COMMENT ON TABLE public.diagnosis_cache IS '投資スタイル診断の回答パターンキャッシュ（同一回答は Gemini 呼び出しをスキップ）';
COMMENT ON COLUMN public.diagnosis_cache.answer_key IS '回答パターンのハッシュキー（例: "1-2-3-1-2-3-1-2-3"）';
COMMENT ON COLUMN public.diagnosis_cache.ai_result IS 'Gemini が生成した診断結果 JSONB';

ALTER TABLE public.diagnosis_cache ENABLE ROW LEVEL SECURITY;

-- ポリシー: 読み取りは全員可能（ゲスト含む）
CREATE POLICY "Anyone can read diagnosis_cache"
  ON public.diagnosis_cache
  FOR SELECT
  USING (true);

-- ポリシー: 書き込みはサービスロール（admin）のみ
CREATE POLICY "Service role can insert diagnosis_cache"
  ON public.diagnosis_cache
  FOR INSERT
  WITH CHECK (true);
