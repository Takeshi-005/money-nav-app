import type { PredictionDirection } from "@/entities/prediction";

export interface SubmitPredictionResult {
  success: boolean;
  revealAt: string;
}

export async function submitPrediction(
  prediction: PredictionDirection,
): Promise<SubmitPredictionResult> {
  const res = await fetch("/api/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prediction }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to submit prediction");
  }
  return res.json();
}
