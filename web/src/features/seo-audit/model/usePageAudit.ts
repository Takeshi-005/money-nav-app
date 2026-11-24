"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-client";
import {
  pageAuditDetailQueryOptions,
  pageAuditListQueryOptions,
} from "./queryOptions";
import {
  type ApplySeoPayload,
  postApplySeo,
  postSuggestSeo,
} from "../api/fetchPageAudit";

export function usePageAuditList() {
  return useQuery(pageAuditListQueryOptions());
}

export function usePageAuditDetail(pagePath: string) {
  return useQuery(pageAuditDetailQueryOptions(pagePath));
}

export function useSuggestSeoMutation() {
  return useMutation({
    mutationFn: (pagePath: string) => postSuggestSeo(pagePath),
  });
}

export function useApplySeoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplySeoPayload) => postApplySeo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seoAudit.all });
    },
  });
}
