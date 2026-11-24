/**
 * 認証ミドルウェア
 * Supabase SSRを使用した認証
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { NAVIGATION_PATHS } from "@/shared/config";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/article/")) {
    return new NextResponse(null, { status: 410 });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // セッションを更新
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /dashboard のみ認証必須（/diagnosis と /quiz は未ログインでも利用可能）
  const isPrivatePath = pathname.startsWith(NAVIGATION_PATHS.DASHBOARD);
  const isLoginPath = pathname === NAVIGATION_PATHS.LOGIN;
  // 未認証ユーザーがプライベートパスにアクセスした場合
  if (!user && isPrivatePath) {
    const url = request.nextUrl.clone();
    url.pathname = NAVIGATION_PATHS.LOGIN;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 認証済みユーザーがログインページにアクセスした場合
  if (user && isLoginPath) {
    const url = request.nextUrl.clone();
    url.pathname = NAVIGATION_PATHS.DASHBOARD;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/article/:path*", "/dashboard/:path*", "/login"],
};
