/**
 * Date Formatting Utilities
 * 日付フォーマット関連のユーティリティ関数
 */

/**
 * 日付をフォーマット（YYYY-MM-DD → M/D形式）
 * @param dateString ISO形式の日付文字列 (例: "2026-01-15")
 * @returns フォーマットされた日付 (例: "1/15")
 */
export function formatDate(dateString: string): string {
  const [, month, day] = dateString.split("-");
  return `${parseInt(month, 10)}/${parseInt(day, 10)}`;
}

/**
 * 日付を日本語形式でフォーマット（YYYY-MM-DD → YYYY年M月D日形式）
 * @param dateString ISO形式の日付文字列 (例: "2026-01-15")
 * @returns フォーマットされた日付 (例: "2026年1月15日")
 */
export function formatDateJapanese(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
}

/**
 * 日付を曜日付きでフォーマット（YYYY-MM-DD → M/D(曜)形式）
 * @param dateString ISO形式の日付文字列 (例: "2026-01-15")
 * @returns フォーマットされた日付 (例: "1/15(木)")
 */
export function formatDateWithDay(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${month}/${day}(${dayOfWeek})`;
}

export function getTodayDateStringJST(): string {
  const now = new Date();
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jstDate.toISOString().split("T")[0];
}

export function getYesterdayDateStringJST(): string {
  const now = new Date();
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  jstDate.setUTCDate(jstDate.getUTCDate() - 1);
  return jstDate.toISOString().split("T")[0];
}

/**
 * 月日のみの日本語形式 (YYYY-MM-DD → M月D日)
 * JST固定で扱う
 */
export function formatMonthDayJP(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00+09:00`);
  return date.toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  });
}

/**
 * 月日に曜日を付与した日本語形式 (YYYY-MM-DD → M月D日(曜))
 * JST固定で扱う
 */
export function formatMonthDayWithWeekdayJP(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00+09:00`);
  return date.toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
}

/**
 * 週次レンジを日本語でフォーマット
 * @param weekStart YYYY-MM-DD
 * @param weekEnd YYYY-MM-DD
 * @param options.withYear true で「YYYY年 M月D日〜M月D日」、既定 false で「M月D日〜M月D日」
 */
export function formatWeekRange(
  weekStart: string,
  weekEnd: string,
  options?: { withYear?: boolean },
): string {
  const start = new Date(`${weekStart}T00:00:00+09:00`);
  const end = new Date(`${weekEnd}T00:00:00+09:00`);
  const fmt: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  };
  const startStr = start.toLocaleDateString("ja-JP", fmt);
  const endStr = end.toLocaleDateString("ja-JP", fmt);
  if (options?.withYear) {
    const year = weekStart.slice(0, 4);
    return `${year}年 ${startStr}〜${endStr}`;
  }
  return `${startStr}〜${endStr}`;
}
