-- ai_generations.content_type の CHECK 制約から 'limit_move' を除外
-- サービスリニューアルでストップ高レポート機能を廃止したため

ALTER TABLE public.ai_generations
  DROP CONSTRAINT IF EXISTS ai_generations_content_type_check;

ALTER TABLE public.ai_generations
  ADD CONSTRAINT ai_generations_content_type_check
  CHECK (content_type IN ('quiz', 'news_article', 'market_analysis', 'weekly_review'));
