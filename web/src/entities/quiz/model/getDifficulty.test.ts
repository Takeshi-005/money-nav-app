import { describe, it, expect } from "vitest";
import {
  getDifficultyFromLevel,
  getDifficultyFromExperience,
} from "./getDifficulty";

// 仕様: beginner(LV1-10) / intermediate(LV11-30) / advanced(LV31+)
// 境界値のみテストし、各帯の中間値テストは省略
describe("getDifficultyFromLevel", () => {
  it("LV10は beginner、LV11は intermediate（境界）", () => {
    expect(getDifficultyFromLevel(10)).toBe("beginner");
    expect(getDifficultyFromLevel(11)).toBe("intermediate");
  });

  it("LV30は intermediate、LV31は advanced（境界）", () => {
    expect(getDifficultyFromLevel(30)).toBe("intermediate");
    expect(getDifficultyFromLevel(31)).toBe("advanced");
  });
});

describe("getDifficultyFromExperience", () => {
  it("経験値1519(LV10最大)は beginner、1770(LV11)は intermediate（境界）", () => {
    expect(getDifficultyFromExperience(1519)).toBe("beginner");
    expect(getDifficultyFromExperience(1770)).toBe("intermediate");
  });

  it("経験値6769(LV30最大)は intermediate、6770(LV31)は advanced（境界）", () => {
    expect(getDifficultyFromExperience(6769)).toBe("intermediate");
    expect(getDifficultyFromExperience(6770)).toBe("advanced");
  });
});
