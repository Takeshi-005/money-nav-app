import { getTodayDateStringJST } from "./format";

export function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function isNotFutureDate(dateString: string): boolean {
  return dateString <= getTodayDateStringJST();
}
