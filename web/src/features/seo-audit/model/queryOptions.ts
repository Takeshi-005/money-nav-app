import { createQueryOptions, queryKeys } from "@/shared/api/query-client";
import {
  fetchPageAuditDetail,
  fetchPageAuditList,
} from "../api/fetchPageAudit";

const FIVE_MINUTES = 5 * 60 * 1000;

export function pageAuditListQueryOptions() {
  return createQueryOptions({
    queryKey: queryKeys.seoAudit.list(),
    queryFn: fetchPageAuditList,
    staleTime: FIVE_MINUTES,
  });
}

export function pageAuditDetailQueryOptions(pagePath: string) {
  return createQueryOptions({
    queryKey: queryKeys.seoAudit.detail(pagePath),
    queryFn: () => fetchPageAuditDetail(pagePath),
    staleTime: FIVE_MINUTES,
    enabled: pagePath.length > 0,
  });
}
