/**
 * Google OAuth サインイン処理
 */
import { createClient } from "@/shared/api/supabase/client"
import type { GoogleAuthResult } from "../model/types"

/**
 * Google OAuth でサインインを開始する
 * @param redirectPath ログイン後のリダイレクト先パス
 * @returns エラー情報を含む結果オブジェクト
 */
export async function signInWithGoogle(
  redirectPath: string = "/dashboard"
): Promise<GoogleAuthResult> {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
    },
  })

  return { error }
}
