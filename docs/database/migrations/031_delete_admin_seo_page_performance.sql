-- Migration: 031_delete_admin_seo_page_performance
-- Description: GA4 計測に混入していた管理画面 (/admin 配下) の内部トラフィックを
--              SEO 集計データから除去する。今後の取り込みは collect.ts 側の
--              isExcludedSeoPath で除外されるため、過去分の汚染データを一括削除する。
-- Created: 2026-06-22

DELETE FROM public.seo_page_performance
WHERE page_path = '/admin'
   OR page_path LIKE '/admin/%';
