/**
 * 認証コンテキスト
 * Supabase Authを使用した認証状態管理
 * ログイン時にゲストデータを自動同期
 */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { createClient } from "@/shared/api/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import {
  getUnsyncedData,
  clearGuestData,
  hasUnsyncedData,
} from "@/shared/lib/guest-storage";

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email ?? null,
    displayName: user.user_metadata?.full_name ?? user.email ?? null,
    photoURL: user.user_metadata?.avatar_url ?? null,
  };
}

interface AuthProviderProps {
  initialUser?: AuthUser | null;
  children: ReactNode;
}

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(initialUser ?? null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!initialUser);
  const syncedRef = useRef(false);

  // ゲストデータの同期
  const syncGuestData = async () => {
    // 既に同期済み or 同期するデータがない場合はスキップ
    if (syncedRef.current || !hasUnsyncedData()) {
      return;
    }

    syncedRef.current = true;
    const unsyncedData = getUnsyncedData();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {};

      if (unsyncedData.diagnosis) {
        payload.diagnosis = {
          input: unsyncedData.diagnosis.input,
          result: unsyncedData.diagnosis.result,
          createdAt: unsyncedData.diagnosis.createdAt,
        };
      }

      if (unsyncedData.quizAttempts.length > 0) {
        payload.quizAttempts = unsyncedData.quizAttempts.map((a) => ({
          quizDate: a.quizDate,
          selectedOptionId: a.selectedOptionId,
          isCorrect: a.isCorrect,
          createdAt: a.createdAt,
        }));
      }

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        clearGuestData();
      } else {
        const errorText = await res.text();
        logger.error("Failed to sync guest data", {
          module: LOG_MODULES.LIB.AUTH_CONTEXT,
          error: errorText,
        });
        syncedRef.current = false; // リトライ可能にする
      }
    } catch (error) {
      logger.error("Failed to sync guest data", {
        module: LOG_MODULES.LIB.AUTH_CONTEXT,
        error: error instanceof Error ? error.message : String(error),
      });
      syncedRef.current = false; // リトライ可能にする
    }
  };

  useEffect(() => {
    const supabase = createClient();

    // 初期セッション取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(mapSupabaseUser(session?.user ?? null));
      setLoading(false);

      // 初回ロード時にセッションがある場合も同期を試みる
      if (session) {
        syncGuestData();
      }
    });

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(mapSupabaseUser(session?.user ?? null));
      setLoading(false);

      // ログイン時に同期処理
      if (event === "SIGNED_IN" && session) {
        syncGuestData();
      }

      // ログアウト時に同期フラグをリセット
      if (event === "SIGNED_OUT") {
        syncedRef.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
