/**
 * 認証機能 (auth) - Public API
 *
 * Google OAuth 認証に関するビジネスロジックを提供
 */

// Types
export type { GoogleAuthState, GoogleAuthResult } from "./model/types"

// Hooks
export { useGoogleAuth, type UseGoogleAuthResult } from "./model/useGoogleAuth"

// API
export { signInWithGoogle } from "./api/signInWithGoogle"
