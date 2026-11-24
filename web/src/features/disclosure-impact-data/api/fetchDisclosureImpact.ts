import type { DisclosureImpactResponse } from "../model/types";

export async function fetchDisclosureImpact(
  date: string,
): Promise<DisclosureImpactResponse> {
  const res = await fetch(`/api/disclosure-impact?date=${date}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch disclosure impact");
  }
  return res.json();
}
