/**
 * QueryClientProvider
 * React Query のプロバイダーコンポーネント
 */
"use client"

import { QueryClientProvider as TanstackQueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, type ReactNode } from "react"
import { makeQueryClient } from "./queryClient"

interface Props {
  children: ReactNode
}

export function QueryClientProvider({ children }: Props) {
  // クライアントの初期化は useState で一度だけ行う
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </TanstackQueryClientProvider>
  )
}
