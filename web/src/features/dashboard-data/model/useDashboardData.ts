"use client"

/**
 * Dashboard Data Feature - Custom Hook
 * ダッシュボードデータの取得・管理フック（React Query版）
 */
import { useQuery } from "@tanstack/react-query"
import { dashboardQueryOptions } from "./queryOptions"
import type { DashboardData, UseDashboardDataResult } from "./types"

const initialData: DashboardData = {
  userData: null,
  quizSummary: null,
  diagnosis: null,
  quizStats: null,
  quizHistory: [],
}

export function useDashboardData(): UseDashboardDataResult {
  const { data, isLoading, error, refetch } = useQuery(dashboardQueryOptions)

  return {
    data: data ?? initialData,
    isLoading,
    error: error ?? null,
    refetch,
  }
}
