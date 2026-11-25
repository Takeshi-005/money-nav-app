import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSafeRedirectPath } from "@/shared/lib/safe-redirect"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = getSafeRedirectPath(searchParams.get("next"))

  // 戻り先のオリジンは設定値を使う(X-Forwarded-Host などのヘッダーは書き換えられるため使わない)
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // エラーの場合はログインページへリダイレクト
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
