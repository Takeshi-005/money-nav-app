-- ============================================
-- Migration: 006_add_profile_fields
-- Description: profiles テーブルに追加フィールドを定義（既存DBとの同期）
-- Created: 2026-01-30
-- ============================================

-- 既にSupabase上で手動追加されているため、
-- IF NOT EXISTS を使用してエラーを回避

-- display_name カラム追加
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name TEXT;

COMMENT ON COLUMN public.profiles.display_name IS 'ユーザー表示名';

-- level カラム追加
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.profiles.level IS '投資家レベル（初期値: 1）';

-- watch_list カラム追加
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS watch_list TEXT[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.profiles.watch_list IS '注目銘柄コードの配列';

-- is_admin カラム追加
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.is_admin IS '管理者フラグ（true=管理者）';

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(level DESC);

-- ============================================
-- 補足: これらのカラムは既にSupabase上で手動追加されているため、
-- このマイグレーションは主にドキュメント目的および
-- 新規環境構築時の再現性確保のために作成されています。
-- ============================================
