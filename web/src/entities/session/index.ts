/**
 * Session Entity - Public API
 *
 * 認証セッションの現在状態（Supabase User/Session）を保持する Context。
 * ゲーミフィケーション等の永続プロフィールは entities/user が担う。
 */
export type { AuthUser } from "./model/auth-context";
export { AuthProvider, useAuth } from "./model/auth-context";
