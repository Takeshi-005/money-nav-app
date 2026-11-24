import { describe, it, expect } from "vitest";
import { getThresholdForLevel, calculateLevel } from "./useLevel";

describe("getThresholdForLevel", () => {
  describe("正常系", () => {
    it("レベル1の閾値は0を返す", () => {
      expect(getThresholdForLevel(1)).toBe(0);
    });

    it("レベル2の閾値は20を返す", () => {
      expect(getThresholdForLevel(2)).toBe(20);
    });

    it("レベル3の閾値は70を返す", () => {
      expect(getThresholdForLevel(3)).toBe(70);
    });

    it("レベル6の閾値は520を返す（最後の定義済み閾値）", () => {
      expect(getThresholdForLevel(6)).toBe(520);
    });

    it("レベル7の閾値は770を返す（LV6以降の計算式開始）", () => {
      // 520 + 1 * 250 = 770
      expect(getThresholdForLevel(7)).toBe(770);
    });

    it("レベル10の閾値は1520を返す", () => {
      // 520 + 4 * 250 = 1520
      expect(getThresholdForLevel(10)).toBe(1520);
    });
  });

  describe("境界値", () => {
    it("レベル0以下の場合は0を返す", () => {
      expect(getThresholdForLevel(0)).toBe(0);
      expect(getThresholdForLevel(-1)).toBe(0);
    });

    it("高レベル（LV100）の閾値を正しく計算する", () => {
      // 520 + (100 - 6) * 250 = 520 + 23500 = 24020
      expect(getThresholdForLevel(100)).toBe(24020);
    });
  });
});

describe("calculateLevel", () => {
  describe("正常系", () => {
    it("経験値0の場合レベル1を返す", () => {
      const result = calculateLevel(0);
      expect(result.level).toBe(1);
      expect(result.expInCurrentLevel).toBe(0);
      expect(result.expPerLevel).toBe(20);
      expect(result.expProgress).toBe(0);
    });

    it("経験値10の場合レベル1で50%進捗を返す", () => {
      const result = calculateLevel(10);
      expect(result.level).toBe(1);
      expect(result.expInCurrentLevel).toBe(10);
      expect(result.expPerLevel).toBe(20);
      expect(result.expProgress).toBe(50);
    });

    it("経験値100の場合レベル3を返す", () => {
      const result = calculateLevel(100);
      expect(result.level).toBe(3);
      expect(result.expInCurrentLevel).toBe(30);
      expect(result.expPerLevel).toBe(100);
      expect(result.expProgress).toBe(30);
    });

    it("経験値1000の場合レベル7を返す", () => {
      // LV7の閾値: 520 + 1 * 250 = 770
      // LV8の閾値: 520 + 2 * 250 = 1020
      const result = calculateLevel(1000);
      expect(result.level).toBe(7);
      expect(result.expInCurrentLevel).toBe(1000 - 770);
      expect(result.expPerLevel).toBe(250);
    });
  });

  describe("境界値（レベルアップの瞬間）", () => {
    it("経験値20の場合レベル2で0%進捗を返す", () => {
      const result = calculateLevel(20);
      expect(result.level).toBe(2);
      expect(result.expInCurrentLevel).toBe(0);
      expect(result.expPerLevel).toBe(50);
      expect(result.expProgress).toBe(0);
    });

    it("経験値70の場合レベル3で0%進捗を返す", () => {
      const result = calculateLevel(70);
      expect(result.level).toBe(3);
      expect(result.expInCurrentLevel).toBe(0);
      expect(result.expPerLevel).toBe(100);
      expect(result.expProgress).toBe(0);
    });

    it("経験値520の場合レベル6で0%進捗を返す", () => {
      const result = calculateLevel(520);
      expect(result.level).toBe(6);
      expect(result.expInCurrentLevel).toBe(0);
      expect(result.expPerLevel).toBe(250);
      expect(result.expProgress).toBe(0);
    });

    it("経験値770の場合レベル7で0%進捗を返す（LV6以降の計算式）", () => {
      const result = calculateLevel(770);
      expect(result.level).toBe(7);
      expect(result.expInCurrentLevel).toBe(0);
      expect(result.expPerLevel).toBe(250);
      expect(result.expProgress).toBe(0);
    });
  });

  describe("異常系", () => {
    it("マイナス経験値の場合レベル1を返す", () => {
      const result = calculateLevel(-10);
      expect(result.level).toBe(1);
    });
  });
});
