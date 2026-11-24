/**
 * kabu-news-ai Icon System
 *
 * Refined Financial Terminal aesthetic
 * - Consistent 1.75px stroke weight
 * - Rounded line caps for approachability
 * - currentColor for theme integration
 * - Accessible with ARIA labels
 */

import { SVGProps } from "react";

// ===== Types =====
export type IconSize = "sm" | "md" | "lg" | "xl";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  /** Icon size preset */
  size?: IconSize;
  /** Custom size in pixels (overrides size preset) */
  customSize?: number;
  /** Stroke width (default: 1.75) */
  strokeWidth?: number;
  /** Accessible label for screen readers */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

// ===== Size Map =====
const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

// ===== Base Icon Component =====
function createIcon(
  path: React.ReactNode,
  defaultLabel: string,
  options: { filled?: boolean; viewBox?: string } = {}
) {
  const { filled = false, viewBox = "0 0 24 24" } = options;

  return function Icon({
    size = "md",
    customSize,
    strokeWidth = 1.75,
    label = defaultLabel,
    className = "",
    ...props
  }: IconProps) {
    const pixelSize = customSize ?? sizeMap[size];

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={pixelSize}
        height={pixelSize}
        viewBox={viewBox}
        fill={filled ? "currentColor" : "none"}
        stroke={filled ? "none" : "currentColor"}
        strokeWidth={filled ? 0 : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label={label}
        className={`flex-shrink-0 ${className}`}
        {...props}
      >
        {path}
      </svg>
    );
  };
}

// ===== Trend Icons =====

/**
 * TrendUp - 上昇トレンド
 * Upward trending line with arrow
 */
export const TrendUp = createIcon(
  <>
    <path d="M3 17L9 11L13 15L21 7" />
    <path d="M17 7H21V11" />
  </>,
  "上昇トレンド"
);

/**
 * TrendDown - 下落トレンド
 * Downward trending line with arrow
 */
export const TrendDown = createIcon(
  <>
    <path d="M3 7L9 13L13 9L21 17" />
    <path d="M17 17H21V13" />
  </>,
  "下落トレンド"
);

/**
 * TrendFlat - 横ばい/レンジ
 * Sideways movement indicator
 */
export const TrendFlat = createIcon(
  <>
    <path d="M3 12H21" />
    <path d="M17 8L21 12L17 16" />
    <path d="M7 8L3 12L7 16" />
  </>,
  "横ばい"
);

// ===== Judgment Icons =====

/**
 * JudgmentPositive - ポジティブ判定
 * Filled circle with check
 */
export const JudgmentPositive = createIcon(
  <>
    <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
    <path
      d="M8 12L11 15L16 9"
      stroke="var(--bg-secondary, white)"
      strokeWidth="2"
      fill="none"
    />
  </>,
  "ポジティブ",
  { filled: true }
);

/**
 * JudgmentNegative - ネガティブ判定
 * Filled circle with X
 */
export const JudgmentNegative = createIcon(
  <>
    <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
    <path
      d="M15 9L9 15M9 9L15 15"
      stroke="var(--bg-secondary, white)"
      strokeWidth="2"
      fill="none"
    />
  </>,
  "ネガティブ",
  { filled: true }
);

/**
 * JudgmentNeutral - 中立判定
 * Filled circle with dash
 */
export const JudgmentNeutral = createIcon(
  <>
    <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
    <path
      d="M8 12H16"
      stroke="var(--bg-secondary, white)"
      strokeWidth="2"
      fill="none"
    />
  </>,
  "中立",
  { filled: true }
);

// ===== UI Icons =====

/**
 * Warning - 警告/RSIダマシ
 * Triangle with exclamation
 */
export const Warning = createIcon(
  <>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </>,
  "警告"
);

/**
 * News - ニュース
 * Newspaper/document icon
 */
export const News = createIcon(
  <>
    <path d="M4 4H16C17.1 4 18 4.9 18 6V18C18 19.1 17.1 20 16 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" />
    <path d="M18 8H20C21.1 8 22 8.9 22 10V18C22 19.1 21.1 20 20 20H18" />
    <line x1="6" y1="8" x2="14" y2="8" />
    <line x1="6" y1="12" x2="14" y2="12" />
    <line x1="6" y1="16" x2="10" y2="16" />
  </>,
  "ニュース"
);

/**
 * Chart - チャート
 * Candlestick/bar chart
 */
export const Chart = createIcon(
  <>
    <rect x="3" y="10" width="4" height="10" rx="1" />
    <rect x="10" y="4" width="4" height="16" rx="1" />
    <rect x="17" y="8" width="4" height="12" rx="1" />
    <line x1="5" y1="7" x2="5" y2="10" />
    <line x1="12" y1="1" x2="12" y2="4" />
    <line x1="19" y1="5" x2="19" y2="8" />
  </>,
  "チャート"
);

/**
 * Indicator - 指標/テクニカル
 * Gauge/meter icon
 */
export const Indicator = createIcon(
  <>
    <circle cx="12" cy="14" r="8" />
    <path d="M12 6V14" />
    <path d="M12 14L16 10" />
    <circle cx="12" cy="14" r="2" fill="currentColor" />
  </>,
  "テクニカル指標"
);

/**
 * Lightbulb - ヒント/インサイト
 */
export const Lightbulb = createIcon(
  <>
    <path d="M9 18H15" />
    <path d="M10 22H14" />
    <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V16C8 16.55 8.45 17 9 17H15C15.55 17 16 16.55 16 16V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z" />
  </>,
  "ヒント"
);

/**
 * ArrowLeft - 戻る
 */
export const ArrowLeft = createIcon(
  <>
    <path d="M19 12H5" />
    <path d="M12 19L5 12L12 5" />
  </>,
  "戻る"
);

/**
 * ArrowRight - 進む
 */
export const ArrowRight = createIcon(
  <>
    <path d="M5 12H19" />
    <path d="M12 5L19 12L12 19" />
  </>,
  "進む"
);

/**
 * ExternalLink - 外部リンク
 */
export const ExternalLink = createIcon(
  <>
    <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" />
    <path d="M15 3H21V9" />
    <path d="M10 14L21 3" />
  </>,
  "外部リンク"
);

/**
 * Moon - ダークモード
 */
export const Moon = createIcon(
  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />,
  "ダークモード"
);

/**
 * Sun - ライトモード
 */
export const Sun = createIcon(
  <>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </>,
  "ライトモード"
);

/**
 * Stock - 株/銘柄
 * Building/company icon
 */
export const Stock = createIcon(
  <>
    <path d="M3 21H21" />
    <path d="M5 21V7L12 3L19 7V21" />
    <path d="M9 21V15H15V21" />
    <rect x="9" y="9" width="2" height="2" fill="currentColor" />
    <rect x="13" y="9" width="2" height="2" fill="currentColor" />
  </>,
  "銘柄"
);

/**
 * Volume - 出来高
 */
export const Volume = createIcon(
  <>
    <rect x="2" y="13" width="4" height="8" rx="1" />
    <rect x="8" y="9" width="4" height="12" rx="1" />
    <rect x="14" y="5" width="4" height="16" rx="1" />
    <rect x="20" y="1" width="2" height="20" rx="0.5" />
  </>,
  "出来高"
);

/**
 * RSI - RSIゲージ
 */
export const RSI = createIcon(
  <>
    <path d="M2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12" />
    <path d="M12 12L16 6" strokeWidth="2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    <path d="M4 18L6 16" />
    <path d="M20 18L18 16" />
    <path d="M12 20V22" />
  </>,
  "RSI"
);

/**
 * Refresh - 更新
 */
export const Refresh = createIcon(
  <>
    <path d="M23 4V10H17" />
    <path d="M1 20V14H7" />
    <path d="M3.51 9A9 9 0 0114.85 3.13L23 10" />
    <path d="M20.49 15A9 9 0 019.15 20.87L1 14" />
  </>,
  "更新"
);

/**
 * Settings - 設定
 */
export const Settings = createIcon(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </>,
  "設定"
);

/**
 * Info - 情報
 */
export const Info = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </>,
  "情報"
);

/**
 * Check - チェック/完了
 */
export const Check = createIcon(
  <path d="M20 6L9 17L4 12" />,
  "完了"
);

/**
 * Close - 閉じる
 */
export const Close = createIcon(
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>,
  "閉じる"
);

/**
 * ChevronUp - 上向き矢印
 */
export const ChevronUp = createIcon(
  <path d="M18 15L12 9L6 15" />,
  "上"
);

/**
 * ChevronDown - 下向き矢印
 */
export const ChevronDown = createIcon(
  <path d="M6 9L12 15L18 9" />,
  "下"
);

/**
 * Calendar - カレンダー/日付
 */
export const Calendar = createIcon(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </>,
  "カレンダー"
);

/**
 * Percent - パーセント/変化率
 */
export const Percent = createIcon(
  <>
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </>,
  "パーセント"
);

// ===== Icon Export Map =====
export const Icons = {
  // Trend
  TrendUp,
  TrendDown,
  TrendFlat,
  // Judgment
  JudgmentPositive,
  JudgmentNegative,
  JudgmentNeutral,
  // UI
  Warning,
  News,
  Chart,
  Indicator,
  Lightbulb,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Moon,
  Sun,
  Stock,
  Volume,
  RSI,
  Refresh,
  Settings,
  Info,
  Check,
  Close,
  ChevronUp,
  ChevronDown,
  Calendar,
  Percent,
} as const;

export type IconName = keyof typeof Icons;

// ===== Dynamic Icon Component =====
interface DynamicIconProps extends IconProps {
  name: IconName;
}

export function Icon({ name, ...props }: DynamicIconProps) {
  const IconComponent = Icons[name];
  return <IconComponent {...props} />;
}

export default Icons;
