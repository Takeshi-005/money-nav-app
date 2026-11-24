-- ============================================
-- Migration: 009_news_articles
-- Description: 投資ニュース解説記事テーブル
-- Created: 2026-02-23
-- ============================================

-- テーブル作成
CREATE TABLE public.news_articles (
  date DATE NOT NULL UNIQUE,          -- 記事対象日（1日1記事、upsert の on_conflict 対象）
  article_content JSONB NOT NULL,     -- AI生成コンテンツ
  created_at TIMESTAMPTZ DEFAULT now()
);

-- コメント
COMMENT ON TABLE public.news_articles IS '投資初心者向けAIニュース解説記事';
COMMENT ON COLUMN public.news_articles.date IS '記事対象日（ユニーク）';
COMMENT ON COLUMN public.news_articles.article_content IS '解説内容（JSONB: title, summary, theme, sections, investorInsight, relatedTopics）';

-- インデックス
CREATE INDEX idx_news_articles_date
  ON public.news_articles(date DESC);

-- RLS（Row Level Security）有効化
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- ポリシー: 読み取りは全員可能
CREATE POLICY "Anyone can read news_articles"
  ON public.news_articles
  FOR SELECT
  USING (true);

-- ポリシー: 書き込みはサービスロール（admin）のみ
CREATE POLICY "Service role can insert news_articles"
  ON public.news_articles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update news_articles"
  ON public.news_articles
  FOR UPDATE
  USING (true);

-- ============================================
-- article_content カラムの構造（参考）
-- ============================================
-- {
--   "title": "初心者が思わず読みたくなるタイトル（60文字以内）",
--   "summary": "記事全体を要約したリード文（100文字以内）",
--   "theme": "今日の記事テーマ（例: 米国金利、円安、半導体）",
--   "sections": [
--     {
--       "heading": "見出し（40文字以内）",
--       "body": "本文（400文字以内）",
--       "keyTerms": [
--         { "term": "専門用語", "definition": "用語の説明（100文字以内）" }
--       ]
--     }
--   ],
--   "investorInsight": "投資家向けまとめ・初心者への実践アドバイス（150文字以内）",
--   "relatedTopics": ["関連テーマ1", "関連テーマ2", "関連テーマ3"]
-- }
