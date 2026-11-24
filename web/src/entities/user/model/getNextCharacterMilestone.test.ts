import { describe, it, expect } from "vitest"
import { getNextCharacterMilestone } from "./getNextCharacterMilestone"

// マイルストーンは LV6, LV11, LV16 の3点。LV16到達でnull
describe("getNextCharacterMilestone", () => {
  it("LV1からはLV6（520EXP）が次のマイルストーン", () => {
    const result = getNextCharacterMilestone(1, 0)
    expect(result?.level).toBe(6)
    expect(result?.requiredExp).toBe(520)
    expect(result?.remainingExp).toBe(520)
    expect(result?.nextImagePath).toBe("/level/lv-06-10.webp")
  })

  it("LV6からはLV11（1770EXP）が次のマイルストーン", () => {
    const result = getNextCharacterMilestone(6, 520)
    expect(result?.level).toBe(11)
    expect(result?.requiredExp).toBe(1770)
    expect(result?.nextImagePath).toBe("/level/lv-11-15.webp")
  })

  it("LV11からはLV16（3020EXP）が次のマイルストーン", () => {
    const result = getNextCharacterMilestone(11, 1770)
    expect(result?.level).toBe(16)
    expect(result?.requiredExp).toBe(3020)
    expect(result?.nextImagePath).toBe("/level/lv-16-20.webp")
  })

  it("途中レベルでも残りEXPが正しく計算される", () => {
    const result = getNextCharacterMilestone(10, 1769)
    expect(result?.level).toBe(11)
    expect(result?.remainingExp).toBe(1)
  })

  it("LV16以降はnullを返す（最後のマイルストーン到達）", () => {
    expect(getNextCharacterMilestone(16, 3020)).toBeNull()
    expect(getNextCharacterMilestone(20, 5000)).toBeNull()
  })
})
