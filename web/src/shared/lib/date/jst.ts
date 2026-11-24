export const JST_TIMEZONE = "Asia/Tokyo";

// // 例: "2024-06-01T12:34:56Z" → "2024-06-01T21:34:56+09:00"
export function toJstIsoString(utcIso: string): string {
  const date = new Date(utcIso);
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000); // JSTはUTCより9時間進んでいる
  const isoString = jstDate.toISOString();
  return isoString.replace("Z", "+09:00");
}
