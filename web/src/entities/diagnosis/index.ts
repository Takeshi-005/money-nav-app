/**
 * Diagnosis Entity - Public API
 */

// Types (re-export from supabase types)
export type { DiagnosisAIResult } from "./model/types"

// Constants
export type { Step } from "./model/constants"
export { TOTAL_STEPS, stepToAnswerKey } from "./model/constants"

// Questions
export type { Question, QuestionOption } from "./model/questions"
export { questions } from "./model/questions"

// Icons
export type { DiagnosisIconKey } from "./ui/DiagnosisIcons"
export { diagnosisIcons, getDiagnosisIcon } from "./ui/DiagnosisIcons"

export type { ResultIconKey } from "./ui/ResultIcons"
export { resultIcons, getResultIcon } from "./ui/ResultIcons"

// Avatar
export type { InvestorAvatarProps, AvatarSize } from "./ui/InvestorAvatar"
export { InvestorAvatar } from "./ui/InvestorAvatar"

// Validators & Cache Key
export {
  DIAGNOSIS_VALID_VALUES,
  isValidDiagnosisInput,
} from "./lib/validators"
export { buildDiagnosisCacheKey } from "./lib/cacheKey"

// Investor Type static data
export type { InvestorTypeStaticData } from "./model/investor-type-data"
export {
  INVESTOR_TYPE_DATA,
  INVESTOR_TYPE_CODES,
} from "./model/investor-type-data"
