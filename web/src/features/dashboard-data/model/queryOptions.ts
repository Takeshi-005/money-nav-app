/**
 * Dashboard Query Options
 * React Query のクエリオプション定義
 */
import { createQueryOptions, queryKeys } from "@/shared/api/query-client"
import { fetchDashboardData } from "../api/fetchDashboardData"
import type { DashboardData } from "./types"

export const dashboardQueryOptions = createQueryOptions<DashboardData>({
  queryKey: queryKeys.dashboard.data(),
  queryFn: fetchDashboardData,
  staleTimePreset: "FREQUENT",
})
