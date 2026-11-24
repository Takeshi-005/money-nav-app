"use client";
import { useQuery } from "@tanstack/react-query";
import { disclosureImpactQueryOptions } from "./queryOptions";

export function useDisclosureImpact(date: string) {
  const { data, isLoading, error } = useQuery(
    disclosureImpactQueryOptions(date),
  );
  return { data, isLoading, error };
}
