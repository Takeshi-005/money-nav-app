import type {
  PageAuditRow,
} from "@/shared/api/seo/page-audit";

export interface SuggestResponse {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedKeywords: string[];
  reasoning: string;
  basedOnQueries: string[];
}

export async function fetchPageAuditList(): Promise<PageAuditRow[]> {
  const response = await fetch("/api/admin/seo-audit/pages", {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch SEO audit list: ${response.status}`);
  }
  const json = (await response.json()) as { rows: PageAuditRow[] };
  return json.rows;
}

export async function fetchPageAuditDetail(
  pagePath: string,
): Promise<PageAuditRow> {
  const response = await fetch(
    `/api/admin/seo-audit/page-detail?path=${encodeURIComponent(pagePath)}`,
    { credentials: "include" },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch page detail: ${response.status}`);
  }
  const json = (await response.json()) as { detail: PageAuditRow };
  return json.detail;
}

export async function postSuggestSeo(
  pagePath: string,
): Promise<SuggestResponse> {
  const response = await fetch("/api/admin/seo-audit/suggest", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pagePath }),
  });
  if (!response.ok) {
    throw new Error(`Failed to generate suggestion: ${response.status}`);
  }
  const json = (await response.json()) as { suggestion: SuggestResponse };
  return json.suggestion;
}

export interface ApplySeoPayload {
  pagePath: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords?: string[];
}

export async function postApplySeo(payload: ApplySeoPayload): Promise<void> {
  const response = await fetch("/api/admin/seo-audit/apply", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: "" }))) as {
      error?: string;
    };
    throw new Error(error.error ?? `Apply failed: ${response.status}`);
  }
}
