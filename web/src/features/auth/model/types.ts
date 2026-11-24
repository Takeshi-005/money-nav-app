/**
 * 認証機能の型定義
 */

/**
 * Google認証の状態
 */
export interface GoogleAuthState {
  isLoading: boolean
  error: string | null
}

/**
 * Google OAuth 処理の結果
 */
export interface GoogleAuthResult {
  error: Error | null
}
