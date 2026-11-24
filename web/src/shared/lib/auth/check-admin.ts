import type { User } from "@supabase/supabase-js";
import { createClient } from "@/shared/api/supabase/server";

/**
 * 現在のリクエストの認証ユーザーが管理者かどうかを判定する。
 * API Route 用。非管理者・未認証の場合は null を返す。
 */
export async function checkAdmin(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin ? user : null;
}
