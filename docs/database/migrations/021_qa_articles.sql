-- 初心者の不安・疑問に答えるQA記事テーブル
CREATE TABLE qa_articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  question text NOT NULL,
  answer_short text NOT NULL,
  answer_detail text NOT NULL,
  category text NOT NULL,
  related_emotions text[],
  related_glossary_slugs text[],
  related_tickers text[],
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN qa_articles.is_published IS 'AI生成後デフォルトfalse。人間レビュー後にtrueに更新して公開する。';

-- RLS有効化（公開読み取り）
ALTER TABLE qa_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa_articles_public_read"
  ON qa_articles
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE INDEX idx_qa_articles_slug ON qa_articles (slug);
CREATE INDEX idx_qa_articles_category ON qa_articles (category);
CREATE INDEX idx_qa_articles_created_at ON qa_articles (created_at DESC);
