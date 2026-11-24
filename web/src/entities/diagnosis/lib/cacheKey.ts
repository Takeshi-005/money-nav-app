import type { DiagnosisInput } from "@/types/supabase";

export function buildDiagnosisCacheKey(input: DiagnosisInput): string {
  return (Object.keys(input) as (keyof DiagnosisInput)[])
    .sort()
    .map((k) => `${k}:${input[k]}`)
    .join("|");
}
