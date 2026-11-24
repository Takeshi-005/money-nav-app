import type { ImportResponse, PreviewResponse } from "../model/types";

interface RawErrorPayload {
  error?: string;
  details?: string[];
}

export async function previewDisclosure(
  analyzedJson: string,
): Promise<PreviewResponse> {
  const res = await fetch("/api/admin/disclosures/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analyzedJson }),
  });

  const data = (await res.json().catch(() => ({}))) as
    | PreviewResponse
    | RawErrorPayload;

  if (!res.ok || !("valid" in data) || !data.valid) {
    const err = data as RawErrorPayload;
    const error = new Error(
      err.error ?? "プレビューに失敗しました",
    ) as Error & {
      details?: string[];
    };
    if (err.details) {
      error.details = err.details;
    }
    throw error;
  }

  return data;
}

export async function importDisclosure(
  analyzedJson: string,
): Promise<ImportResponse> {
  const res = await fetch("/api/admin/disclosures/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analyzedJson }),
  });

  const data = (await res.json().catch(() => ({}))) as
    | ImportResponse
    | RawErrorPayload;

  if (!res.ok) {
    const err = data as RawErrorPayload;
    throw new Error(err.error ?? "取り込みに失敗しました");
  }

  return data as ImportResponse;
}
