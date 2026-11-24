import { describe, it, expect } from "vitest"
import { cn } from "./utils"

// cn() は clsx + tailwind-merge の薄いラッパー。
// ライブラリ自体の挙動は信頼し、プロジェクトで重要な
// 「Tailwind競合の解決」と「falsy除外」のみ確認する。
describe("cn", () => {
  it("競合するTailwindクラスは後者が勝つ", () => {
    expect(cn("px-4", "px-6")).toBe("px-6")
  })

  it("falsy値を除外して有効なクラスのみ連結する", () => {
    expect(cn("base", false, null, undefined, "end")).toBe("base end")
  })
})
