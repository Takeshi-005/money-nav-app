-- ============================================
-- Migration: 003_announcements
-- Description: お知らせを管理するテーブル
-- Created: 2026-01-14
-- ============================================

-- テーブル作成
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,                    -- お知らせタイトル
  description TEXT NOT NULL,              -- お知らせ本文
  link_url TEXT,                          -- リンク先URL（任意）
  link_text TEXT,                         -- リンクテキスト（任意）
  is_active BOOLEAN DEFAULT true,         -- 表示中かどうか
  display_order INTEGER DEFAULT 0,        -- 表示順序（小さい順）
  created_at TIMESTAMPTZ DEFAULT now()    -- 作成日時
);

-- コメント
COMMENT ON TABLE public.announcements IS 'サービスのお知らせ情報';
COMMENT ON COLUMN public.announcements.title IS 'お知らせタイトル';
COMMENT ON COLUMN public.announcements.description IS 'お知らせ本文';
COMMENT ON COLUMN public.announcements.link_url IS 'リンク先URL（任意）';
COMMENT ON COLUMN public.announcements.link_text IS 'リンクテキスト（任意）';
COMMENT ON COLUMN public.announcements.is_active IS '表示フラグ（false=非表示）';
COMMENT ON COLUMN public.announcements.display_order IS '表示順序（昇順）';

-- インデックス
CREATE INDEX idx_announcements_active_order
  ON public.announcements(is_active, display_order);

-- RLS（Row Level Security）有効化
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ポリシー: 読み取りは全員可能（有効なもののみ）
CREATE POLICY "Anyone can read active announcements"
  ON public.announcements
  FOR SELECT
  USING (is_active = true);

-- ポリシー: 書き込みはサービスロール（admin）のみ
-- ※ Service Role はRLSをバイパスするため、明示的なポリシーは不要
-- （管理はSupabaseダッシュボードから手動操作）
