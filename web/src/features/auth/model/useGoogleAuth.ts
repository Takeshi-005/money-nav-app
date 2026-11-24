/**
 * Google認証状態管理フック
 */
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithGoogle } from "../api/signInWithGoogle";
import type { GoogleAuthState } from "./types";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

export interface UseGoogleAuthResult extends GoogleAuthState {
  handleGoogleLogin: (redirectPath?: string) => Promise<void>;
}

/**
 * Google OAuth 認証を管理するフック
 * URLパラメータからリダイレクト先とエラー状態を取得する
 */
export function useGoogleAuth(): UseGoogleAuthResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const handleGoogleLogin = async (redirectPath?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const redirect =
        redirectPath ?? searchParams.get("redirect") ?? "/dashboard";
      const { error } = await signInWithGoogle(redirect);

      if (error) {
        throw error;
      }
    } catch (err) {
      logger.error("Login error", {
        module: LOG_MODULES.FEATURES.AUTH,
        error: err instanceof Error ? err.message : String(err),
      });
      setError("ログインに失敗しました。もう一度お試しください。");
      setIsLoading(false);
    }
  };

  // URLエラーパラメータの処理
  const urlError = searchParams.get("error");
  const displayError =
    error || (urlError ? "ログイン処理中にエラーが発生しました。" : null);

  return {
    isLoading,
    error: displayError,
    handleGoogleLogin,
  };
}
