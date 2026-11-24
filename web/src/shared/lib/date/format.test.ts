import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  formatDate,
  formatDateJapanese,
  formatDateWithDay,
  getTodayDateStringJST,
  formatMonthDayJP,
  formatMonthDayWithWeekdayJP,
  formatWeekRange,
} from "./format"

describe("単発フォーマット関数", () => {
  it("formatDateは M/D 形式を返す（ゼロパディングなし）", () => {
    expect(formatDate("2026-03-05")).toBe("3/5")
  })

  it("formatDateJapaneseは YYYY年M月D日 形式を返す", () => {
    expect(formatDateJapanese("2026-03-05")).toBe("2026年3月5日")
  })

  it("formatDateWithDayは M/D(曜) 形式を返す", () => {
    expect(formatDateWithDay("2026-02-09")).toBe("2/9(月)")
  })

  it("formatMonthDayJPは M月D日 形式を返す", () => {
    expect(formatMonthDayJP("2026-02-09")).toBe("2月9日")
  })

  it("formatMonthDayWithWeekdayJPは M月D日(曜) 形式を返す", () => {
    expect(formatMonthDayWithWeekdayJP("2026-02-09")).toBe("2月9日(月)")
  })
})

describe("formatWeekRange", () => {
  it("既定で M月D日〜M月D日 形式を返す", () => {
    expect(formatWeekRange("2026-02-02", "2026-02-08")).toBe("2月2日〜2月8日")
  })

  it("月跨ぎ週でも正しくフォーマットする", () => {
    expect(formatWeekRange("2026-01-26", "2026-02-01")).toBe("1月26日〜2月1日")
  })

  it("withYear指定時は開始年を前置する（年跨ぎでも開始年）", () => {
    expect(
      formatWeekRange("2025-12-29", "2026-01-04", { withYear: true }),
    ).toBe("2025年 12月29日〜1月4日")
  })
})

describe("getTodayDateStringJST", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("UTC 14:59 (JST 23:59)はJST当日を返す", () => {
    vi.setSystemTime(new Date("2026-02-08T14:59:00Z"))
    expect(getTodayDateStringJST()).toBe("2026-02-08")
  })

  it("UTC 15:00 (JST 翌日0:00)はJST翌日を返す", () => {
    vi.setSystemTime(new Date("2026-02-08T15:00:00Z"))
    expect(getTodayDateStringJST()).toBe("2026-02-09")
  })
})
