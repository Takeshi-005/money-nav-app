/**
 * 予測トレーニング生成・解決 Cron API
 * Cloud Scheduler から毎日 09:00 JST に呼び出される
 *
 * STEP 1: 未解決の予測を Gemini で「プラス材料 / マイナス材料」判定し解説生成
 * STEP 2: 今日の予測問題を生成（ニュース取得 → Gemini で材料予測問題生成）
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { fetchMarketNews } from "@/shared/api/news-api";
import {
  generatePredictionQuestion,
  generatePredictionResolution,
} from "@/shared/api/gemini/prediction";
import { getTodayDateStringJST } from "@/shared/lib/date";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { verifySchedulerToken } from "@/shared/lib/verify-scheduler-token";
import { grantExperience } from "@/shared/lib/experience";
import { formatError } from "@/shared/lib/error-formatter";
import { isRateLimitError } from "@/shared/lib/api-errors";
import { calculatePerformanceStats } from "@/entities/prediction";
import {
  sendPredictionSkipToSlack,
  type PredictionSkipReason,
} from "@/shared/api/slack/send-prediction-skip-notification";
import type { SupabaseClient } from "@supabase/supabase-js";

type GenerateOutcome =
  | { ok: true }
  | { ok: false; reason: PredictionSkipReason; detail?: string };

const PREDICTION_NEWS_MAX_RESULTS = 5;
const CORRECT_PREDICTION_EXP = 30;

async function revealOldestUnresolvedPrediction(
  supabase: ReturnType<typeof createAdminClient>,
  today: string,
): Promise<{ revealedDate: string | null; actualMovement: string | null }> {
  const { data: target } = await supabase
    .from("prediction_results")
    .select("date, question, context_summary")
    .eq("is_revealed", false)
    .lt("date", today)
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!target) {
    return { revealedDate: null, actualMovement: null };
  }

  let actualMovement: "up" | "down";
  let explanation: string;
  try {
    const result = await generatePredictionResolution(
      target.context_summary ?? "",
      target.question ?? "",
      target.date,
    );
    actualMovement = result.materialDirection;
    explanation = result.explanation;
  } catch (error) {
    logger.warn("Prediction resolution generation failed, skip reveal", {
      module: LOG_MODULES.API.CRON_PREDICTION,
      date: target.date,
      error: error instanceof Error ? error.message : String(error),
    });
    return { revealedDate: null, actualMovement: null };
  }

  const { error: updateError } = await supabase
    .from("prediction_results")
    .update({
      actual_movement: actualMovement,
      explanation,
      is_revealed: true,
    })
    .eq("date", target.date);

  if (updateError) {
    logger.error("Failed to update prediction_results", {
      module: LOG_MODULES.API.CRON_PREDICTION,
      error: updateError.message,
    });
    return { revealedDate: null, actualMovement: null };
  }

  const { data: userPredictions } = await supabase
    .from("predictions")
    .select("id, user_id, prediction")
    .eq("date", target.date);

  if (userPredictions && userPredictions.length > 0) {
    for (const pred of userPredictions) {
      const isCorrect = pred.prediction === actualMovement;

      await supabase
        .from("predictions")
        .update({ is_correct: isCorrect })
        .eq("id", pred.id);

      if (isCorrect) {
        try {
          await grantExperience(
            supabase as unknown as SupabaseClient,
            pred.user_id,
            CORRECT_PREDICTION_EXP,
          );
        } catch {
          // best-effort
        }
      }
    }

    await updateUserPerformance(supabase, userPredictions.map((p) => p.user_id));
  }

  return { revealedDate: target.date, actualMovement };
}

async function updateUserPerformance(
  supabase: ReturnType<typeof createAdminClient>,
  userIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(userIds)];
  for (const userId of uniqueIds) {
    try {
      const { data: allPreds } = await supabase
        .from("predictions")
        .select("is_correct, pnl")
        .eq("user_id", userId)
        .not("is_correct", "is", null)
        .order("created_at", { ascending: true });

      const stats = calculatePerformanceStats(allPreds ?? []);
      if (!stats) {
        continue;
      }

      await supabase.from("user_performance").upsert({
        user_id: userId,
        total_predictions: stats.total,
        correct_predictions: stats.correct,
        win_rate: stats.winRate,
        total_pnl: stats.totalPnl,
        current_streak: stats.currentStreak,
        max_streak: stats.maxStreak,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.warn("Failed to update user_performance", {
        module: LOG_MODULES.API.CRON_PREDICTION,
        userId,
        ...formatError(error),
      });
    }
  }
}

async function generateTodayPrediction(
  supabase: ReturnType<typeof createAdminClient>,
  today: string,
): Promise<GenerateOutcome> {
  const { data: existing } = await supabase
    .from("prediction_results")
    .select("date")
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    return { ok: false, reason: "already_exists" };
  }

  let newsArticles: Awaited<ReturnType<typeof fetchMarketNews>> = [];
  let newsFetchError: string | undefined;
  try {
    newsArticles = await fetchMarketNews({
      date: today,
      maxResults: PREDICTION_NEWS_MAX_RESULTS,
    });
  } catch (error) {
    newsFetchError = error instanceof Error ? error.message : String(error);
    logger.warn("Failed to fetch news for prediction", {
      module: LOG_MODULES.API.CRON_PREDICTION,
      error: newsFetchError,
    });
  }

  if (newsArticles.length === 0) {
    logger.warn("No news available, skipping prediction generation", {
      module: LOG_MODULES.API.CRON_PREDICTION,
      date: today,
    });
    return {
      ok: false,
      reason: "no_news",
      detail: newsFetchError ?? "fetch succeeded but 0 articles after filter",
    };
  }

  const { question, contextSummary } = await generatePredictionQuestion(
    newsArticles,
    today,
  );

  const { error } = await supabase.from("prediction_results").insert({
    date: today,
    question,
    context_summary: contextSummary,
    is_revealed: false,
  });

  if (error) {
    logger.error("Failed to insert prediction_results", {
      module: LOG_MODULES.API.CRON_PREDICTION,
      error: error.message,
    });
    return { ok: false, reason: "insert_failed", detail: error.message };
  }

  return { ok: true };
}

export async function POST(request: NextRequest) {
  try {
    const isValid = await verifySchedulerToken(
      request.headers.get("authorization"),
    );
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = getTodayDateStringJST();
    const supabase = createAdminClient();

    const { revealedDate, actualMovement } = await revealOldestUnresolvedPrediction(
      supabase,
      today,
    );

    const generated = await generateTodayPrediction(supabase, today);

    if (!generated.ok) {
      await sendPredictionSkipToSlack(today, generated.reason, generated.detail);
    }

    return NextResponse.json({
      message: "Prediction cron completed",
      date: today,
      revealed: revealedDate ? { date: revealedDate, actualMovement } : null,
      generated,
    });
  } catch (error) {
    logger.error("Prediction cron error", {
      module: LOG_MODULES.API.CRON_PREDICTION,
      ...formatError(error),
    });
    if (isRateLimitError(error)) {
      return NextResponse.json(
        {
          error:
            "AIサービスが混雑しています。しばらく待ってから再度お試しください。",
          code: "RATE_LIMIT",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "予測生成中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
