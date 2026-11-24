"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api";
import { computeRoadmapStage } from "@/entities/roadmap";
import type { RoadmapProgress, RoadmapSignals } from "@/entities/roadmap";
import {
  clearRoadmapFlags,
  getRoadmapFlagsValue,
  setRoadmapFlag,
  useGuestPracticeSignals,
  useRoadmapFlags,
  type RoadmapFlags,
  type RoadmapPracticeSignals,
} from "../lib/flagsStorage";
import { fetchRoadmapFlags, reportRoadmapStep } from "../api/roadmapApi";

export type { RoadmapPracticeSignals };

export interface UseRoadmapProgressResult {
  progress: RoadmapProgress;
  reportAccountOpened: () => void;
  reportFirstPurchase: () => void;
}

const EMPTY_FLAGS: RoadmapFlags = {
  accountOpenedAt: null,
  firstPurchaseAt: null,
};

/**
 * ロードマップの現在地を算出するフック。
 *
 * @param loggedInSignals ログイン時はサーバー由来のシグナルを渡す（views 層で
 *   useDashboardData から）。null の場合はゲストとみなす。
 *
 * フラグの永続化先:
 * - ログイン: DB(profiles) を /api/roadmap 経由で読み書き（React Query）
 * - ゲスト: localStorage（useSyncExternalStore）
 * ゲスト時に記録したフラグは、ログイン後に一度だけ DB へ移行する。
 */
export function useRoadmapProgress(
  loggedInSignals: RoadmapPracticeSignals | null,
): UseRoadmapProgressResult {
  const isLoggedIn = loggedInSignals !== null;
  const queryClient = useQueryClient();

  // ゲスト: localStorage
  const localFlags = useRoadmapFlags();
  const guestSignals = useGuestPracticeSignals();

  // ログイン: DB(profiles)
  const { data: serverFlags } = useQuery({
    queryKey: queryKeys.roadmap.flags(),
    queryFn: fetchRoadmapFlags,
    enabled: isLoggedIn,
    staleTime: 60_000,
  });

  const reportMutation = useMutation({
    mutationFn: reportRoadmapStep,
    onSuccess: (flags) => {
      queryClient.setQueryData(queryKeys.roadmap.flags(), flags);
    },
  });

  // ゲスト時に localStorage へ記録したフラグを、ログイン後に一度だけ DB へ移行
  const migratedRef = useRef(false);
  useEffect(() => {
    if (!isLoggedIn || migratedRef.current || serverFlags === undefined) {
      return;
    }
    migratedRef.current = true;
    const local = getRoadmapFlagsValue();
    if (!local.accountOpenedAt && !local.firstPurchaseAt) {
      return;
    }
    void (async () => {
      try {
        if (local.accountOpenedAt && !serverFlags.accountOpenedAt) {
          await reportRoadmapStep("account");
        }
        if (local.firstPurchaseAt && !serverFlags.firstPurchaseAt) {
          await reportRoadmapStep("firstPurchase");
        }
        clearRoadmapFlags();
        await queryClient.invalidateQueries({
          queryKey: queryKeys.roadmap.flags(),
        });
      } catch {
        migratedRef.current = false; // 失敗時はリトライ可能にする
      }
    })();
  }, [isLoggedIn, serverFlags, queryClient]);

  const flags: RoadmapFlags = isLoggedIn
    ? (serverFlags ?? EMPTY_FLAGS)
    : localFlags;

  const signals: RoadmapSignals = useMemo(() => {
    const practice = loggedInSignals ?? guestSignals;
    return {
      ...practice,
      predictionWinRate: null,
      predictionTotal: 0,
      accountOpenedAt: flags.accountOpenedAt,
      firstPurchaseAt: flags.firstPurchaseAt,
    };
  }, [loggedInSignals, guestSignals, flags]);

  const progress = useMemo(() => computeRoadmapStage(signals), [signals]);

  const reportAccountOpened = useCallback(() => {
    if (isLoggedIn) {
      reportMutation.mutate("account");
    } else {
      setRoadmapFlag("account");
    }
  }, [isLoggedIn, reportMutation]);

  const reportFirstPurchase = useCallback(() => {
    if (isLoggedIn) {
      reportMutation.mutate("firstPurchase");
    } else {
      setRoadmapFlag("firstPurchase");
    }
  }, [isLoggedIn, reportMutation]);

  return { progress, reportAccountOpened, reportFirstPurchase };
}
