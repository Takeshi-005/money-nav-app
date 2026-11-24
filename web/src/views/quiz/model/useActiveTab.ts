/**
 * Quiz Active Tab Hook
 * クイズのアクティブタブ管理Hook
 *
 * useEffect内でsetStateを呼ぶ代わりに、useMemoで派生状態を計算することで
 * 連鎖的な再レンダリングを防ぎます。
 */

"use client"

import { useMemo, useState, useCallback } from "react"
import {
  QUIZ_TABS,
  type QuizType,
  type QuizAttemptsMap,
  type SingleQuizData,
} from "@/entities/quiz"

interface UseActiveTabParams {
  quizzes: SingleQuizData[] | undefined
  attempts: QuizAttemptsMap | undefined
}

/**
 * アクティブタブを管理するHook
 *
 * 【動作仕様】
 * 1. ユーザーが手動でタブを選択した場合、その選択を優先
 * 2. 自動選択モード（初回表示・回答後）では、未回答の最初のタブを選択
 * 3. 全て回答済みの場合は、最初のクイズのタブを表示
 */
export function useActiveTab({ quizzes, attempts }: UseActiveTabParams) {
  const [userSelectedTab, setUserSelectedTab] = useState<QuizType | null>(null)

  // 現在アクティブなタブを計算（派生状態）
  const activeTab = useMemo((): QuizType => {
    if (!quizzes || !attempts) {return "news"}

    // ユーザーが手動選択していて、そのタブが存在すればそれを優先
    if (
      userSelectedTab &&
      quizzes.some((q) => q.quiz_type === userSelectedTab)
    ) {
      return userSelectedTab
    }

    const firstUnanswered = QUIZ_TABS.find(
      (tab) =>
        !attempts[tab.type]?.answered &&
        quizzes.some((q) => q.quiz_type === tab.type)
    )

    return firstUnanswered?.type || quizzes[0]?.quiz_type || "news"
  }, [quizzes, attempts, userSelectedTab])

  const setActiveTab = useCallback((tab: QuizType) => {
    setUserSelectedTab(tab)
  }, [])

  const resetToAutoMode = useCallback(() => {
    setUserSelectedTab(null)
  }, [])

  return { activeTab, setActiveTab, resetToAutoMode }
}
