import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-client";
import { fetchDisclosureImpact } from "../api/fetchDisclosureImpact";

export const disclosureImpactQueryOptions = (date: string) =>
  queryOptions({
    queryKey: queryKeys.disclosureImpact.byDate(date),
    queryFn: () => fetchDisclosureImpact(date),
    staleTime: 24 * 60 * 60 * 1000,
  });
