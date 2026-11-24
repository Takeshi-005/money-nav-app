import type { DiagnosisInput } from "@/types/supabase";

export const DIAGNOSIS_VALID_VALUES: {
  [K in keyof DiagnosisInput]: readonly DiagnosisInput[K][];
} = {
  region: ["japan", "us"],
  period: ["short", "medium", "long"],
  style: ["growth", "dividend"],
  riskTolerance: ["low", "medium", "high"],
  budget: ["1", "3", "10"],
  purpose: ["retirement", "income", "hobby", "fire"],
  lossReaction: ["sell", "hold", "buy_more"],
  decisionBasis: ["news", "chart", "financials", "intuition"],
  volatilityResponse: ["immediate", "analyze", "ignore"],
};

export function isValidDiagnosisInput(
  input: Partial<DiagnosisInput>,
): input is DiagnosisInput {
  return (Object.keys(DIAGNOSIS_VALID_VALUES) as (keyof DiagnosisInput)[]).every(
    (key) => {
      const value = input[key];
      if (value === undefined) {
        return false;
      }
      const validValues = DIAGNOSIS_VALID_VALUES[key] as readonly string[];
      return validValues.includes(value);
    },
  );
}
