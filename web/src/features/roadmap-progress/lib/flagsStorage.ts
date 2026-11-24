/**
 * ロードマップ用 localStorage ストア（自己申告フラグ＋ゲストのシグナル）。
 *
 * SSR 安全・ハイドレーション不整合回避のため useSyncExternalStore で公開する
 * （effect 内同期 setState を避ける）。MVP ではログイン/ゲストともに localStorage を使い、
 * #032 マイグレーション適用後にログイン分を DB(profiles)へ移行する。
 */
import { useSyncExternalStore } from "react";
import { calculateQuizStats } from "@/entities/quiz";
import { getGuestDiagnosis, getGuestQuizAttempts } from "@/shared/lib/guest-storage";

const STORAGE_KEY = "roadmap_self_report";

export interface RoadmapFlags {
  accountOpenedAt: string | null;
  firstPurchaseAt: string | null;
}

/** 練習段階までの判定に使うシグナル（ログイン時は views 層から渡す） */
export interface RoadmapPracticeSignals {
  hasDiagnosis: boolean;
  quizStreakDays: number;
  quizTotalAttempts: number;
}

const EMPTY_FLAGS: RoadmapFlags = {
  accountOpenedAt: null,
  firstPurchaseAt: null,
};

const EMPTY_PRACTICE: RoadmapPracticeSignals = {
  hasDiagnosis: false,
  quizStreakDays: 0,
  quizTotalAttempts: 0,
};

// --- 購読基盤（同タブは手動 emit、別タブは storage イベント） -----------------

const listeners = new Set<() => void>();
let storageBound = false;

function ensureStorageBinding() {
  if (storageBound || typeof window === "undefined") {
    return;
  }
  window.addEventListener("storage", () => {
    flagsCache = undefined;
    guestCache = undefined;
    listeners.forEach((listener) => listener());
  });
  storageBound = true;
}

function subscribe(listener: () => void): () => void {
  ensureStorageBinding();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

// --- フラグ --------------------------------------------------------------------

let flagsCache: RoadmapFlags | undefined;

function getFlagsSnapshot(): RoadmapFlags {
  if (typeof window === "undefined") {
    return EMPTY_FLAGS;
  }
  if (flagsCache) {
    return flagsCache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<RoadmapFlags>) : {};
    flagsCache = {
      accountOpenedAt: parsed.accountOpenedAt ?? null,
      firstPurchaseAt: parsed.firstPurchaseAt ?? null,
    };
  } catch {
    flagsCache = EMPTY_FLAGS;
  }
  return flagsCache;
}

/** 指定フラグに「今」を記録する（既に記録済みなら上書きしない） */
export function setRoadmapFlag(type: "account" | "firstPurchase"): void {
  if (typeof window === "undefined") {
    return;
  }
  const current = getFlagsSnapshot();
  const now = new Date().toISOString();
  const next: RoadmapFlags = {
    accountOpenedAt:
      type === "account"
        ? (current.accountOpenedAt ?? now)
        : current.accountOpenedAt,
    firstPurchaseAt:
      type === "firstPurchase"
        ? (current.firstPurchaseAt ?? now)
        : current.firstPurchaseAt,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  flagsCache = next;
  emit();
}

/** 非React文脈での読み取り（guest→DB 移行などに使用） */
export function getRoadmapFlagsValue(): RoadmapFlags {
  return getFlagsSnapshot();
}

/** localStorage のフラグを消去（DB移行後に呼ぶ） */
export function clearRoadmapFlags(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
  flagsCache = EMPTY_FLAGS;
  emit();
}

export function useRoadmapFlags(): RoadmapFlags {
  return useSyncExternalStore(subscribe, getFlagsSnapshot, () => EMPTY_FLAGS);
}

// --- ゲストのシグナル ----------------------------------------------------------

let guestCache: RoadmapPracticeSignals | undefined;

function getGuestSnapshot(): RoadmapPracticeSignals {
  if (typeof window === "undefined") {
    return EMPTY_PRACTICE;
  }
  if (guestCache) {
    return guestCache;
  }
  const stats = calculateQuizStats(
    getGuestQuizAttempts().map((attempt) => ({
      quiz_date: attempt.quizDate,
      is_correct: attempt.isCorrect,
    })),
  );
  guestCache = {
    hasDiagnosis: getGuestDiagnosis() !== null,
    quizStreakDays: stats.streakDays,
    quizTotalAttempts: stats.totalAttempts,
  };
  return guestCache;
}

export function useGuestPracticeSignals(): RoadmapPracticeSignals {
  return useSyncExternalStore(
    subscribe,
    getGuestSnapshot,
    () => EMPTY_PRACTICE,
  );
}
