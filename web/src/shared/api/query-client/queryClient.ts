/**
 * QueryClient 設定
 * React Query のグローバル設定を管理
 */
import { QueryClient } from "@tanstack/react-query"

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // データが「新鮮」とみなされる時間（5分）
        staleTime: 5 * 60 * 1000,
        // キャッシュ保持時間（30分）
        gcTime: 30 * 60 * 1000,
        // エラー時のリトライ回数
        retry: 1,
        // ウィンドウフォーカス時の再取得を無効化
        refetchOnWindowFocus: false,
        // ネットワーク再接続時の自動再取得
        refetchOnReconnect: true,
      },
      mutations: {
        // Mutation はデフォルトでリトライしない
        retry: 0,
      },
    },
  })
}

// ブラウザ用シングルトン
let browserQueryClient: QueryClient | undefined = undefined

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: 常に新しいクライアントを作成
    return makeQueryClient()
  } else {
    // Browser: シングルトンを再利用
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
  }
}
