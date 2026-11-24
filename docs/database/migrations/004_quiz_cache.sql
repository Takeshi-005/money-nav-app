-- Migration: 004_quiz_cache.sql
-- Description: 中級・上級クイズのキャッシュテーブルを作成
-- Date: 2026-01-18

-- quiz_cache テーブルの作成
CREATE TABLE IF NOT EXISTS public.quiz_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('intermediate', 'advanced')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, difficulty)
);

COMMENT ON TABLE public.quiz_cache IS '中級・上級クイズのキャッシュ（1日有効）';
COMMENT ON COLUMN public.quiz_cache.difficulty IS '難易度: intermediate, advanced';
COMMENT ON COLUMN public.quiz_cache.content IS 'クイズコンテンツ（DailyQuizContent形式のJSON）';

-- インデックスの作成
CREATE INDEX idx_quiz_cache_date_difficulty ON public.quiz_cache(date, difficulty);

-- Row Level Security (RLS) の有効化
ALTER TABLE public.quiz_cache ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 誰でも閲覧可能
CREATE POLICY "Anyone can view quiz cache"
  ON public.quiz_cache
  FOR SELECT
  USING (true);
