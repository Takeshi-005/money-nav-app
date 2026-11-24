-- ============================================
-- Migration: 028_drop_disclosure_summary
-- Description: kabutan 利用規約準拠化のため、disclosure_events から kabutan 編集者由来の
--              summary / raw_segment カラムを完全削除する。reason / educational_note は
--              claude.ai が Web 検索で公的ソース（TDnet・企業IR）から生成するため残す。
-- Created: 2026-06-06
-- ============================================

ALTER TABLE public.disclosure_events
  DROP COLUMN IF EXISTS summary,
  DROP COLUMN IF EXISTS raw_segment;

COMMENT ON TABLE public.disclosure_events IS
  '記事から抽出した銘柄識別情報のみ。kabutan 由来表現は保持しない（規約準拠）';
