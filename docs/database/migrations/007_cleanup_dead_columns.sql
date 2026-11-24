-- announcements テーブル削除
DROP POLICY IF EXISTS "Anyone can read active announcements" ON public.announcements;
DROP INDEX IF EXISTS idx_announcements_active_order;
DROP TABLE IF EXISTS public.announcements;

-- daily_quizzes のデッドカラム削除
ALTER TABLE public.daily_quizzes DROP COLUMN IF EXISTS news_source;
ALTER TABLE public.daily_quizzes DROP COLUMN IF EXISTS target_sector;

-- profiles のデッドカラム削除
ALTER TABLE public.profiles DROP COLUMN IF EXISTS watch_list;
