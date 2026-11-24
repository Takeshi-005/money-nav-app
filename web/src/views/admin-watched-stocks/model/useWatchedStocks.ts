"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationOptions, QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-client";
import {
  addWatchedStock,
  deleteWatchedStock,
  fetchWatchedStocks,
  updateWatchedStockActive,
  updateWatchedStockEarningsDate,
} from "../api/watchedStocks";

function createInvalidatingMutation<TData, TVariables>(
  qc: QueryClient,
  mutationFn: (variables: TVariables) => Promise<TData>,
  hooks?: {
    onSuccess?: () => void;
    onError?: (message: string) => void;
  },
): UseMutationOptions<TData, Error, TVariables> {
  return {
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminWatchedStocks.all });
      hooks?.onSuccess?.();
    },
    onError: (e: Error) => hooks?.onError?.(e.message),
  };
}

interface UseWatchedStocksOptions {
  onAddSuccess?: () => void;
  onAddError?: (message: string) => void;
  onActionSuccess?: () => void;
  onActionError?: (message: string) => void;
}

export function useWatchedStocks(options?: UseWatchedStocksOptions) {
  const qc = useQueryClient();

  const { data: stocks = [], isLoading } = useQuery({
    queryKey: queryKeys.adminWatchedStocks.all,
    queryFn: fetchWatchedStocks,
  });

  const addMutation = useMutation(
    createInvalidatingMutation(qc, addWatchedStock, {
      onSuccess: options?.onAddSuccess,
      onError: options?.onAddError,
    }),
  );

  const toggleMutation = useMutation(
    createInvalidatingMutation(qc, updateWatchedStockActive, {
      onSuccess: options?.onActionSuccess,
      onError: options?.onActionError,
    }),
  );

  const earningsDateMutation = useMutation(
    createInvalidatingMutation(qc, updateWatchedStockEarningsDate, {
      onSuccess: options?.onActionSuccess,
      onError: options?.onActionError,
    }),
  );

  const deleteMutation = useMutation(
    createInvalidatingMutation(qc, deleteWatchedStock, {
      onSuccess: options?.onActionSuccess,
      onError: options?.onActionError,
    }),
  );

  return {
    stocks,
    isLoading,
    addMutation,
    toggleMutation,
    earningsDateMutation,
    deleteMutation,
  };
}
