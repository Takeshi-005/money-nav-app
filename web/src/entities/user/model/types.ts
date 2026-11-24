/**
 * User Entity - Type Definitions
 * ユーザー関連の型定義
 */

/** ユーザーデータ（ダッシュボード用） */
export interface UserData {
  level: number;
  experience: number;
  investmentStyle: string | null;
}

/** レベル計算結果 */
export interface UserLevel {
  level: number;
  expInCurrentLevel: number;
  expProgress: number; // 0-100
  expPerLevel: number;
}

/** 認証ユーザー情報（表示用） */
export interface UserDisplayInfo {
  displayName?: string | null;
  photoURL?: string | null;
}
