-- QA記事テーブルの廃止
-- 021_qa_articles.sql で作成した qa_articles テーブルは戦略再設計により廃止する。
-- 汎用QA記事は大手金融サイトと正面衝突するため、マネナビ独自データに紐付くコンテンツに方針変更。
DROP TABLE IF EXISTS qa_articles;
