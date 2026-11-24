-- ============================================
-- Migration: 034_drop_comic_strips_and_weekly_reviews
-- Description: 削除済み機能（漫画ストリップ・週次レビュー）の残骸テーブルを削除する。
--              機能本体はコミット 15e5347 で削除済みで、web/src からの参照はゼロ。
--              テーブルを残すと自動生成型 (database.types.ts) に不要な型が残り続けるため掃除する。
-- Created: 2026-07-13
-- ============================================

-- RLS ポリシー・インデックス・トリガーはテーブルと同時に削除される
DROP TABLE IF EXISTS public.comic_strips;
DROP TABLE IF EXISTS public.weekly_reviews;

-- ロールバックが必要な場合は、以下の作成マイグレーションを再実行する:
--   025_comic_strips.sql  （comic_strips 本体）
--   012_weekly_reviews.sql（weekly_reviews 本体）
--   015_ai_observability.sql の weekly_reviews 向け ALTER / INDEX（100〜110行目付近）
-- ※ データ自体は復元されない
