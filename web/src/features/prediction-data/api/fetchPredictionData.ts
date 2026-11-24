import type { PredictionPageData } from "@/entities/prediction";

export async function fetchPredictionData(): Promise<PredictionPageData> {
  const res = await fetch("/api/predictions", { cache: "no-store" });
  if (!res.ok) {throw new Error("Failed to fetch prediction data");}
  return res.json();
}
