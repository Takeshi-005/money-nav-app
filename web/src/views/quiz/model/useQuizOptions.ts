/**
 * Quiz Options Hook
 * クイズ選択肢管理Hook
 *
 * タブごとに選択肢を個別に管理することで、タブ切り替え時に
 * 自動的に選択肢がリセットされる挙動を実現します。
 */

"use client"

import { useState, useCallback } from "react"
import type { QuizType } from "@/entities/quiz"

/**
 * クイズの選択肢を管理するHook
 *
 * 【動作仕様】
 * 1. 各タブ（news, basic, scenario）ごとに選択肢を保持
 * 2. タブ切り替え時、getSelected()で自動的に別タブの選択肢を取得
 * 3. clearSelected()で回答後に選択肢をクリア
 */
export function useQuizOptions() {
  const [selectedByTab, setSelectedByTab] = useState<
    Record<QuizType, number | null>
  >({
    news: null,
    basic: null,
    scenario: null,
    psychology: null,
    history: null,
  })

  // 指定タブの選択肢を取得
  const getSelected = useCallback(
    (tab: QuizType) => {
      return selectedByTab[tab]
    },
    [selectedByTab]
  )

  // 指定タブの選択肢を設定
  const setSelected = useCallback((tab: QuizType, optionId: number) => {
    setSelectedByTab((prev) => ({
      ...prev,
      [tab]: optionId,
    }))
  }, [])

  // 指定タブの選択肢をクリア
  const clearSelected = useCallback((tab: QuizType) => {
    setSelectedByTab((prev) => ({
      ...prev,
      [tab]: null,
    }))
  }, [])

  return { getSelected, setSelected, clearSelected }
}
