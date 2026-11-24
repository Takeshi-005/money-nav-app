-- ============================================
-- Migration: 024_news_articles_seo_overrides
-- Description: ニュース記事に SEO タイトル/ディスクリプション/キーワードの
--              上書きカラムを追加する。null の場合は既存 article_content.title
--              をフォールバックとして使うため、既存挙動を破壊しない。
-- Created: 2026-05-25
-- ============================================

ALTER TABLE public.news_articles
  ADD COLUMN seo_title TEXT,
  ADD COLUMN seo_description TEXT,
  ADD COLUMN seo_keywords TEXT[],
  ADD COLUMN seo_updated_at TIMESTAMPTZ,
  ADD COLUMN seo_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.news_articles.seo_title IS 'SEO最適化された<title>用タイトル。null時は article_content.title をフォールバック使用';
COMMENT ON COLUMN public.news_articles.seo_description IS 'SEO最適化されたmeta description。null時は article_content.summary をフォールバック使用';
COMMENT ON COLUMN public.news_articles.seo_keywords IS 'SEOキーワード配列。null時はデフォルトキーワードセットを使用';
COMMENT ON COLUMN public.news_articles.seo_updated_at IS 'SEO上書きが最後に更新された時刻';
COMMENT ON COLUMN public.news_articles.seo_updated_by IS 'SEO上書きを最後に更新した管理者のユーザーID';

CREATE INDEX IF NOT EXISTS idx_news_articles_seo_updated_at
  ON public.news_articles(seo_updated_at DESC)
  WHERE seo_updated_at IS NOT NULL;
