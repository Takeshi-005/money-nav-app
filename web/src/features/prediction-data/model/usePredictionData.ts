"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-client";
import { fetchPredictionData } from "../api/fetchPredictionData";

export function usePredictionData() {
  return useQuery({
    queryKey: queryKeys.prediction.today(),
    queryFn: fetchPredictionData,
    staleTime: 5 * 60 * 1000,
  });
}
