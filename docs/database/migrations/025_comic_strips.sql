-- ============================================
-- Migration: 025_comic_strips
-- Description: 4コマ漫画コンテンツテーブル
-- Created: 2026-05-28
-- ============================================

CREATE TABLE public.comic_strips (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_no          INTEGER NOT NULL UNIQUE,
  slug                TEXT NOT NULL UNIQUE,
  theme               TEXT NOT NULL,
  pattern             TEXT NOT NULL CHECK (pattern IN ('A', 'B', 'C')),
  emotional_core      TEXT NOT NULL,
  educational_concept TEXT NOT NULL,
  image_path          TEXT NOT NULL,
  image_alt           TEXT NOT NULL,
  panels              JSONB NOT NULL,
  is_published        BOOLEAN NOT NULL DEFAULT false,
  published_at        TIMESTAMPTZ,
  seo_title           TEXT,
  seo_description     TEXT,
  seo_keywords        TEXT[],
  seo_updated_at      TIMESTAMPTZ,
  seo_updated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.comic_strips IS '投資初心者向け4コマ漫画コンテンツ';
COMMENT ON COLUMN public.comic_strips.episode_no IS '連番（URL エイリアス /comic-strips/1 用）';
COMMENT ON COLUMN public.comic_strips.slug IS 'SEO カノニカル URL 用スラッグ（英小文字/数字/ハイフン）';
COMMENT ON COLUMN public.comic_strips.pattern IS '4コマ構成パターン: A=悩み解消型, B=SNS比較型, C=暴落動揺型';
COMMENT ON COLUMN public.comic_strips.image_path IS 'Supabase Storage 内の相対パス（例: episodes/001.png）';
COMMENT ON COLUMN public.comic_strips.image_alt IS '4コマ統合画像のアクセシビリティ説明';
COMMENT ON COLUMN public.comic_strips.panels IS 'JSONB array: 各コマの {panel, character, expression, situation, dialogue} メタ';
COMMENT ON COLUMN public.comic_strips.is_published IS 'false にすると一覧/詳細から非表示にできるキルスイッチ';
COMMENT ON COLUMN public.comic_strips.published_at IS '公開日時（未公開は null）';

CREATE INDEX idx_comic_strips_episode_no
  ON public.comic_strips (episode_no DESC);

CREATE INDEX idx_comic_strips_slug
  ON public.comic_strips (slug);

CREATE INDEX idx_comic_strips_published
  ON public.comic_strips (published_at DESC)
  WHERE is_published = true AND published_at IS NOT NULL;

ALTER TABLE public.comic_strips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published comic_strips"
  ON public.comic_strips
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Service role can insert comic_strips"
  ON public.comic_strips
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update comic_strips"
  ON public.comic_strips
  FOR UPDATE
  USING (true);

-- ============================================
-- panels カラムの構造（参考）
-- ============================================
-- [
--   {
--     "panel": 1,                       -- 1〜4
--     "character": "yuki" | "aya" | "tajima",
--     "expression": "anxious" | ...,    -- キャラごとに6種
--     "situation": "コマの状況描写",
--     "dialogue": "セリフ（最大30文字、改行込み2行まで）"
--   },
--   ... 4コマ分
-- ]
