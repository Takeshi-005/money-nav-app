-- 投資用語辞典テーブル
CREATE TABLE glossary_terms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  term text NOT NULL,
  reading text,
  category text NOT NULL,
  definition text NOT NULL,
  explanation text NOT NULL,
  example text,
  related_terms text[],
  difficulty text DEFAULT 'beginner',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS有効化（公開読み取り）
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "glossary_terms_public_read"
  ON glossary_terms
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- slugでの検索を高速化
CREATE INDEX idx_glossary_terms_slug ON glossary_terms (slug);
CREATE INDEX idx_glossary_terms_category ON glossary_terms (category);
