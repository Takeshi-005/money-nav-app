/**
 * ログインページ
 * Google OAuth を使用した認証ページ
 */
"use client"

import { Suspense } from "react"
import { LoginForm, LoginFormLoading } from "@/widgets/login-form"

export function LoginPage() {
  return (
    <div className="max-w-md mx-auto my-8 px-6 sm:px-8 py-16 w-full bg-surface-secondary rounded-2xl shadow-sm">
      <Suspense fallback={<LoginFormLoading />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
