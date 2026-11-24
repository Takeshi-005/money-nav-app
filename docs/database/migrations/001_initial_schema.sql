-- ============================================
-- Migration: 001_initial_schema
-- Description: 初期スキーマ（profiles, diagnostics, daily_quizzes, quiz_attempts）
-- Created: 2026-01-14
-- ============================================

-- ============================================
-- 1. profiles テーブル
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  experience INTEGER DEFAULT 0,         -- 経験値
  investment_style TEXT,                -- 投資スタイル（診断結果）
  created_at TIMESTAMPTZ DEFAULT now()  -- 作成日時
);

COMMENT ON TABLE public.profiles IS 'ユーザープロフィール';
COMMENT ON COLUMN public.profiles.id IS 'ユーザーID（auth.usersと同一）';
COMMENT ON COLUMN public.profiles.experience IS '累計経験値';
COMMENT ON COLUMN public.profiles.investment_style IS '投資スタイル（診断で判定）';

-- インデックス
CREATE INDEX idx_profiles_experience ON public.profiles(experience DESC);

-- ============================================
-- 2. diagnostics テーブル
-- ============================================
CREATE TABLE public.diagnostics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_result JSONB NOT NULL,              -- AI診断結果（JSON）
  updated_at TIMESTAMPTZ DEFAULT now(),  -- 更新日時
  created_at TIMESTAMPTZ DEFAULT now()   -- 作成日時
);

COMMENT ON TABLE public.diagnostics IS '投資スタイル診断結果';
COMMENT ON COLUMN public.diagnostics.user_id IS 'ユーザーID（1ユーザー1レコード）';
COMMENT ON COLUMN public.diagnostics.ai_result IS 'Gemini APIによる診断結果';

-- インデックス
CREATE INDEX idx_diagnostics_user_id ON public.diagnostics(user_id);

-- ============================================
-- 3. daily_quizzes テーブル
-- ============================================
CREATE TABLE public.daily_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,             -- クイズ日付（1日1セット）
  content JSONB NOT NULL,                -- クイズ内容（3問セット）
  created_at TIMESTAMPTZ DEFAULT now()   -- 作成日時
);

COMMENT ON TABLE public.daily_quizzes IS '毎日のクイズ（3問セット）';
COMMENT ON COLUMN public.daily_quizzes.date IS 'クイズ対象日（ユニーク）';
COMMENT ON COLUMN public.daily_quizzes.content IS 'クイズ内容（news, basic, scenario）';

-- インデックス
CREATE INDEX idx_daily_quizzes_date ON public.daily_quizzes(date DESC);

-- ============================================
-- 4. quiz_attempts テーブル
-- ============================================
CREATE TABLE public.quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_date DATE NOT NULL,               -- クイズ日付
  quiz_type TEXT NOT NULL DEFAULT 'news', -- クイズタイプ（news, basic, scenario）
  is_correct BOOLEAN NOT NULL,           -- 正解したか
  choice_selected INTEGER NOT NULL,      -- 選択した選択肢ID
  created_at TIMESTAMPTZ DEFAULT now(),  -- 作成日時
  UNIQUE(user_id, quiz_date, quiz_type)  -- 1ユーザー1日1タイプにつき1回
);

COMMENT ON TABLE public.quiz_attempts IS 'クイズ回答履歴';
COMMENT ON COLUMN public.quiz_attempts.quiz_type IS 'クイズタイプ: news, basic, scenario';
COMMENT ON COLUMN public.quiz_attempts.is_correct IS '正解: true, 不正解: false';

-- インデックス
CREATE INDEX idx_quiz_attempts_user_date ON public.quiz_attempts(user_id, quiz_date DESC);

-- ============================================
-- 5. profiles自動作成トリガー
-- ============================================
-- 新規ユーザー登録時にprofilesレコードを自動作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. RLS（Row Level Security）有効化
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLSポリシー: profiles
-- ============================================
-- 本人のみ閲覧可能
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 本人のみ更新可能
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 本人のみ挿入可能（トリガーで自動作成されるため通常は不要）
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 8. RLSポリシー: diagnostics
-- ============================================
-- 本人のみ閲覧可能
CREATE POLICY "Users can view own diagnostics"
  ON public.diagnostics
  FOR SELECT
  USING (auth.uid() = user_id);

-- 本人のみ挿入可能
CREATE POLICY "Users can insert own diagnostics"
  ON public.diagnostics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 本人のみ更新可能
CREATE POLICY "Users can update own diagnostics"
  ON public.diagnostics
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 9. RLSポリシー: daily_quizzes
-- ============================================
-- 全員閲覧可能（書き込みはService Roleのみ）
CREATE POLICY "Anyone can view quizzes"
  ON public.daily_quizzes
  FOR SELECT
  USING (true);

-- ============================================
-- 10. RLSポリシー: quiz_attempts
-- ============================================
-- 本人のみ閲覧可能
CREATE POLICY "Users can view own attempts"
  ON public.quiz_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- 本人のみ挿入可能
CREATE POLICY "Users can insert own attempts"
  ON public.quiz_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
