-- 廃止テーブル削除: 市場解説・ストップ高レポート
-- 対応するページ・API・Cronジョブもコードから削除済み（サービスリニューアル）

-- market_analyses テーブル削除
DROP TABLE IF EXISTS public.market_analyses CASCADE;

-- limit_move_reports テーブル削除
DROP TABLE IF EXISTS public.limit_move_reports CASCADE;
