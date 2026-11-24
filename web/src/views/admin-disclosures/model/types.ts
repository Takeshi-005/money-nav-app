import type {
  DisclosureType,
  Impact,
  Magnitude,
} from "@/shared/api/gemini/disclosure-extraction";

export interface PreviewEvent {
  tickerCode: string;
  companyName: string;
  disclosureType: DisclosureType;
  impact: Impact;
  magnitude: Magnitude;
  relevanceScore: number;
  keyConcept: string;
  reason: string;
  educationalNote: string;
  isWatched: boolean;
}

export interface PreviewSummary {
  totalEvents: number;
  droppedCount: number;
  watchedCount: number;
  unwatchedCount: number;
  distribution: {
    impact: { positive: number; negative: number; neutral: number };
    magnitude: { large: number; medium: number; small: number };
  };
}

export interface PreviewResponse {
  valid: true;
  duplicate: { existingImportId: string; importedAt: string } | null;
  payload: { articleDate: string; sourceUrl: string | null };
  summary: PreviewSummary;
  events: PreviewEvent[];
}

export interface PreviewError {
  valid?: false;
  error: string;
  details?: string[];
}

export interface ImportResponse {
  importId: string;
  savedEventsCount: number;
  savedAnalysesCount: number;
  droppedCount?: number;
  watchedCount: number;
  unwatchedCount: number;
}
