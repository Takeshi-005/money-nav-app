/**
 * React Query のqueryOptions生成ユーティリティ
 */

import {
  queryOptions,
  type QueryFunction,
  type QueryKey,
} from "@tanstack/react-query";
import { STALE_TIME } from "./queryConfig";

interface CreateQueryOptionsParams<
  TQueryFnData = unknown,
  _TError = Error,
  _TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> {
  queryKey: TQueryKey;
  queryFn: QueryFunction<TQueryFnData, TQueryKey>;
  staleTimePreset?: keyof typeof STALE_TIME;
  staleTime?: number;
  gcTime?: number;
  enabled?: boolean;
}

export function createQueryOptions<
  TQueryFnData = unknown,
  _TError = Error,
  _TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>({
  queryKey,
  queryFn,
  staleTimePreset,
  staleTime,
  gcTime,
  enabled,
}: CreateQueryOptionsParams<TQueryFnData, _TError, _TData, TQueryKey>) {
  return queryOptions<TQueryFnData, _TError, _TData, TQueryKey>({
    queryKey,
    queryFn,
    ...(staleTimePreset && { staleTime: STALE_TIME[staleTimePreset] }),
    ...(staleTime !== undefined && { staleTime }),
    ...(gcTime !== undefined && { gcTime }),
    ...(enabled !== undefined && { enabled }),
  });
}
