/**
 * Quiz Entity - Public API
 */

// Types
export type {
  QuizSummary,
  QuizStats,
  QuizType,
  QuizOption,
  QuizHistoryItem,
  DailyHistory,
  SingleQuizData,
  QuizResult,
  QuizAttempt,
  QuizAttemptsMap,
} from "./model/types";

// Constants
export {
  QUIZ_TYPE_LABELS,
  QUIZ_TABS,
  QUIZ_UPDATE_TIME,
} from "./model/constants";

// Formatters & Utils
export {
  formatDate,
  formatDateJapanese,
  calculateAccuracy,
} from "./model/formatters";

// Legacy Format
export { isLegacyFormat, convertLegacyToNew } from "./model/legacyFormat";
export type { LegacyQuizContent } from "./model/legacyFormat";

// Difficulty Logic
export {
  getDifficultyFromExperience,
  getDifficultyFromLevel,
  DIFFICULTY_THRESHOLDS,
} from "./model/getDifficulty";

// Stats & Scoring
export { calculateQuizStats, PERFECT_DAY_MIN_QUIZZES } from "./lib/stats";
export { isAllCorrect } from "./lib/scoring";

// Components
export {
  QuizTypeIcon,
  QuizTypeIconsGroup,
  type QuizTypeIconProps,
} from "./ui/QuizTypeIcons";
export {
  QuizResultBadge,
  type QuizResultBadgeProps,
} from "./ui/QuizResultBadge";
export { QuizTypeBadge, type QuizTypeBadgeProps } from "./ui/QuizTypeBadge";
export {
  CorrectnessBadge,
  type CorrectnessBadgeProps,
} from "./ui/CorrectnessBadge";
export { OptionItem, type OptionItemProps } from "./ui/OptionItem";
export { ExplanationBox, type ExplanationBoxProps } from "./ui/ExplanationBox";

// Quiz Card
export { QuizCard, type QuizCardProps } from "./ui/QuizCard";

// Icons
export {
  NewsIcon,
  BasicIcon,
  ScenarioIcon,
  PsychologyIcon,
  HistoryIcon,
  QuestionIcon,
  CorrectIcon,
  IncorrectIcon,
  PendingIcon,
  TrophyIcon,
  ThumbsUpIcon,
  MuscleIcon,
  LoadingIcon,
  ErrorIcon,
  CalendarIcon,
  LightbulbIcon,
  ClockIcon,
} from "./ui/QuizIcons";
