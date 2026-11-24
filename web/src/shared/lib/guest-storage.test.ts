import { describe, it, expect, beforeEach, vi } from "vitest"
import type {
  GuestDiagnosis,
  GuestQuizAttempt,
  GuestQuizAttemptLegacy,
} from "./guest-storage"

const localStorageStore: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key]
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach((key) => delete localStorageStore[key])
  }),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
})

import {
  saveGuestDiagnosis,
  getGuestDiagnosis,
  getGuestQuizAttempts,
  clearGuestData,
  hasUnsyncedData,
  getUnsyncedData,
} from "./guest-storage"

const mockDiagnosis: GuestDiagnosis = {
  input: {
    region: "japan",
    period: "long",
    style: "growth",
    riskTolerance: "medium",
    budget: "3",
    purpose: "retirement",
    lossReaction: "hold",
    decisionBasis: "financials",
    volatilityResponse: "analyze",
  },
  result: {
    typeCode: "BUFFETT",
    investorType: "バフェット型",
    resultText: "テスト結果",
    famousQuote: "テスト格言",
    strengths: ["強み1"],
    weaknesses: ["弱み1"],
    actionAdvice: "テストアドバイス",
    recommendedSectors: ["金融"],
    suggestedTickers: [],
  },
  createdAt: new Date().toISOString(),
  synced: false,
}

const mockAttempt: GuestQuizAttempt = {
  quizDate: "2025-01-14",
  quizType: "news",
  selectedOptionId: 1,
  isCorrect: true,
  gainedExp: 10,
  createdAt: new Date().toISOString(),
  synced: false,
}

const mockLegacyAttempt: GuestQuizAttemptLegacy = {
  quizDate: "2025-01-13",
  selectedOptionId: 2,
  isCorrect: false,
  gainedExp: 5,
  createdAt: new Date().toISOString(),
  synced: false,
}

function seedQuizAttempts(attempts: GuestQuizAttempt[]): void {
  localStorage.setItem("guest_quiz_attempts_v2", JSON.stringify(attempts))
}

describe("guest-storage", () => {
  beforeEach(() => {
    Object.keys(localStorageStore).forEach((key) => delete localStorageStore[key])
    vi.clearAllMocks()
  })

  describe("診断データ", () => {
    it("保存・取得が可能で、存在しない場合はnullを返す", () => {
      expect(getGuestDiagnosis()).toBeNull()

      saveGuestDiagnosis(mockDiagnosis)
      expect(getGuestDiagnosis()).toEqual(mockDiagnosis)
    })
  })

  describe("クイズ回答データ", () => {
    it("保存済みの回答を取得できる", () => {
      seedQuizAttempts([mockAttempt, { ...mockAttempt, quizDate: "2025-01-15" }])

      expect(getGuestQuizAttempts()).toHaveLength(2)
    })

    it("データが無いとき空配列を返す", () => {
      expect(getGuestQuizAttempts()).toEqual([])
    })

    it("旧形式(v1)の回答はnewsタイプとしてv2形式へ移行される", () => {
      localStorage.setItem(
        "guest_quiz_attempts",
        JSON.stringify([mockLegacyAttempt])
      )

      const attempts = getGuestQuizAttempts()

      expect(attempts).toHaveLength(1)
      expect(attempts[0].quizType).toBe("news")
      expect(localStorage.getItem("guest_quiz_attempts")).toBeNull()
      expect(localStorage.getItem("guest_quiz_attempts_v2")).not.toBeNull()
    })
  })

  describe("同期状態", () => {
    it("初期状態は未同期データなし", () => {
      expect(hasUnsyncedData()).toBe(false)
    })

    it("未同期のクイズ回答があればtrueになり、getUnsyncedDataで取得できる", () => {
      seedQuizAttempts([mockAttempt])

      expect(hasUnsyncedData()).toBe(true)

      const unsynced = getUnsyncedData()
      expect(unsynced.quizAttempts).toHaveLength(1)
      expect(unsynced.diagnosis).toBeNull()
    })

    it("clearGuestDataで全データを削除する", () => {
      seedQuizAttempts([mockAttempt])
      saveGuestDiagnosis(mockDiagnosis)

      clearGuestData()

      expect(hasUnsyncedData()).toBe(false)
      expect(getGuestQuizAttempts()).toEqual([])
      expect(getGuestDiagnosis()).toBeNull()
    })
  })
})
