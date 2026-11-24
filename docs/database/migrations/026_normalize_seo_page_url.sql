-- ============================================
-- Migration: 026_normalize_seo_page_url
-- Description: seo_search_performance.page を完全URLからpath形式に正規化
-- Created: 2026-05-31
-- ============================================

-- 背景:
--   Search Console API が `keys[1]` を完全URL (https://money-nav.com/...) で返すため、
--   そのまま page カラムに保存されていた。
--   page-audit.ts は NAVIGATION_BUILDERS 由来の path (/...) で照合するため、
--   全ページが query_unacquired に誤分類されていた。
--
-- 関連修正: web/src/lib/seo/normalize-path.ts
--           （新規 INSERT 以降は path 形式で保存されるよう正規化を追加）

UPDATE seo_search_performance
SET page = CASE
  WHEN page = 'https://money-nav.com/' THEN '/'
  ELSE REPLACE(page, 'https://money-nav.com', '')
END
WHERE page LIKE 'https://money-nav.com%';
