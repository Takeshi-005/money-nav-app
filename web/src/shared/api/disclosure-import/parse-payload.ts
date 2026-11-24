import { createHash } from "node:crypto";
import {
  analyzedDisclosurePayloadSchema,
  type AnalyzedDisclosureEvent,
  type AnalyzedDisclosurePayload,
} from "@/shared/api/gemini/disclosure-extraction";

export interface PayloadParseError {
  kind: "invalid_json" | "schema_error";
  message: string;
  details?: string[];
}

export interface ParsedPayload {
  payload: AnalyzedDisclosurePayload;
  textHash: string;
}

export function parseAnalyzedPayload(
  analyzedJson: string,
): { ok: true; data: ParsedPayload } | { ok: false; error: PayloadParseError } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(analyzedJson);
  } catch (e) {
    return {
      ok: false,
      error: {
        kind: "invalid_json",
        message:
          e instanceof Error
            ? `JSON が不正です: ${e.message}`
            : "JSON が不正です",
      },
    };
  }

  const result = analyzedDisclosurePayloadSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: {
        kind: "schema_error",
        message: "JSON のフォーマットがスキーマに一致しません",
        details: result.error.issues.map(
          (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
        ),
      },
    };
  }

  const textHash = createHash("sha256").update(analyzedJson).digest("hex");
  return { ok: true, data: { payload: result.data, textHash } };
}

export interface EventClassification {
  watched: AnalyzedDisclosureEvent[];
  unwatched: AnalyzedDisclosureEvent[];
}

export function classifyEvents(
  events: AnalyzedDisclosureEvent[],
  watchedSet: Set<string>,
): EventClassification {
  const watched: AnalyzedDisclosureEvent[] = [];
  const unwatched: AnalyzedDisclosureEvent[] = [];
  for (const e of events) {
    if (watchedSet.has(e.tickerCode)) {
      watched.push(e);
    } else {
      unwatched.push(e);
    }
  }
  return { watched, unwatched };
}

export interface DistributionSummary {
  impact: { positive: number; negative: number; neutral: number };
  magnitude: { large: number; medium: number; small: number };
}

export function summarizeEvents(
  events: AnalyzedDisclosureEvent[],
): DistributionSummary {
  const dist: DistributionSummary = {
    impact: { positive: 0, negative: 0, neutral: 0 },
    magnitude: { large: 0, medium: 0, small: 0 },
  };
  for (const e of events) {
    dist.impact[e.impact] += 1;
    dist.magnitude[e.magnitude] += 1;
  }
  return dist;
}
