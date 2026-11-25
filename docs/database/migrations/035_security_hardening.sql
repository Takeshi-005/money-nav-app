-- ============================================
-- 035: RLS とプロフィールの権限を見直す
-- ============================================
-- 1. 「Service role can ...」のポリシーは TO の指定がなく、anon・authenticated にも
--    書き込みを許していた。service_role は RLS を通らないので、これらのポリシーは不要。
-- 2. RLS が無効だったテーブルを有効にする。いずれもサーバー側の service_role からのみ
--    使うため、anon・authenticated 向けのポリシーは作らない(すべて拒否)。
-- 3. profiles は本人が更新できるため、is_admin と experience を本人が書き換えられた。
--    service_role 以外からの変更をトリガーで拒否する。

-- --------------------------------------------
-- 1. TO の指定がない書き込みポリシーを削除
-- --------------------------------------------
DROP POLICY IF EXISTS "Service role can insert news_articles" ON public.news_articles;
DROP POLICY IF EXISTS "Service role can update news_articles" ON public.news_articles;
DROP POLICY IF EXISTS "Service role can insert diagnosis_cache" ON public.diagnosis_cache;
DROP POLICY IF EXISTS "Service role can manage disclosure_imports" ON public.disclosure_imports;
DROP POLICY IF EXISTS "Service role can manage disclosure_events" ON public.disclosure_events;

-- --------------------------------------------
-- 2. RLS が無効だったテーブル
-- --------------------------------------------
ALTER TABLE public.watched_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_impact_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_performance ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------
-- 3. profiles の権限に関わる列を守る
-- --------------------------------------------
-- auth.role() が anon / authenticated のとき(= API から利用者のトークンで呼ばれたとき)だけ制限する。
-- service_role と、SQL エディタなどからの直接操作(JWT なし)は対象外。
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF coalesce(auth.role(), '') NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_admin := false;
    NEW.experience := 0;
    RETURN NEW;
  END IF;

  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW.experience IS DISTINCT FROM OLD.experience THEN
    RAISE EXCEPTION 'is_admin and experience cannot be changed by users'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();
