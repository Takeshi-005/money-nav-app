import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/api/supabase/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { getTodayDateStringJST } from "@/shared/lib/date";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";
import { SUPABASE_ERROR_CODES } from "@/shared/lib/supabase-errors";
import type { PredictionDirection, UserPerformance } from "@/types/supabase";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const adminSupabase = createAdminClient();
    const today = getTodayDateStringJST();

    const { data: todayResult } = await adminSupabase
      .from("prediction_results")
      .select("date, question, context_summary, is_revealed, actual_movement, explanation")
      .eq("date", today)
      .maybeSingle();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: yesterdayResult } = await adminSupabase
      .from("prediction_results")
      .select("date, actual_movement, explanation")
      .eq("date", yesterdayStr)
      .eq("is_revealed", true)
      .maybeSingle();

    const isGuest = !user;

    let todayUserPrediction: PredictionDirection | undefined;
    let yesterdayUserPrediction: PredictionDirection | undefined;
    let isYesterdayCorrect: boolean | undefined;
    let performance: UserPerformance = {
      totalPredictions: 0,
      correctPredictions: 0,
      winRate: 0,
      totalPnl: 0,
      currentStreak: 0,
      maxStreak: 0,
    };

    if (user) {
      const [todayPred, yesterdayPred, perf] = await Promise.all([
        adminSupabase
          .from("predictions")
          .select("prediction")
          .eq("user_id", user.id)
          .eq("date", today)
          .maybeSingle(),
        adminSupabase
          .from("predictions")
          .select("prediction, is_correct")
          .eq("user_id", user.id)
          .eq("date", yesterdayStr)
          .maybeSingle(),
        adminSupabase
          .from("user_performance")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      todayUserPrediction = todayPred.data?.prediction as PredictionDirection | undefined;
      yesterdayUserPrediction = yesterdayPred.data?.prediction as PredictionDirection | undefined;
      isYesterdayCorrect = yesterdayPred.data?.is_correct ?? undefined;

      if (perf.data) {
        performance = {
          totalPredictions: perf.data.total_predictions,
          correctPredictions: perf.data.correct_predictions,
          winRate: perf.data.win_rate,
          totalPnl: perf.data.total_pnl,
          currentStreak: perf.data.current_streak,
          maxStreak: perf.data.max_streak,
        };
      }
    }

    return NextResponse.json({
      today: todayResult
        ? {
            date: todayResult.date,
            question: todayResult.question,
            contextSummary: todayResult.context_summary,
            isRevealed: todayResult.is_revealed,
            userPrediction: todayUserPrediction,
          }
        : null,
      yesterday:
        yesterdayResult && yesterdayResult.actual_movement
          ? {
              date: yesterdayResult.date,
              actualMovement: yesterdayResult.actual_movement as PredictionDirection,
              explanation: yesterdayResult.explanation,
              userPrediction: yesterdayUserPrediction,
              isCorrect: isYesterdayCorrect,
            }
          : null,
      performance,
      isGuest,
    });
  } catch (error) {
    logger.error("GET /api/predictions error", {
      module: LOG_MODULES.API.PREDICTIONS,
      ...formatError(error),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const prediction = body.prediction as PredictionDirection;
    if (prediction !== "up" && prediction !== "down") {
      return NextResponse.json(
        { error: "prediction must be 'up' or 'down'" },
        { status: 400 },
      );
    }

    const today = getTodayDateStringJST();
    const adminSupabase = createAdminClient();

    const { data: predResult } = await adminSupabase
      .from("prediction_results")
      .select("date")
      .eq("date", today)
      .maybeSingle();

    if (!predResult) {
      return NextResponse.json(
        { error: "今日の予測問題がまだ生成されていません" },
        { status: 404 },
      );
    }

    const { error } = await adminSupabase.from("predictions").insert({
      user_id: user.id,
      date: today,
      prediction,
    });

    if (error) {
      if (error.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION) {
        return NextResponse.json(
          { error: "今日の予測はすでに送信済みです" },
          { status: 409 },
        );
      }
      throw error;
    }

    const revealAt = new Date(today);
    revealAt.setDate(revealAt.getDate() + 1);
    revealAt.setHours(9, 0, 0, 0);

    return NextResponse.json({
      success: true,
      revealAt: new Date(revealAt.getTime() - JST_OFFSET_MS).toISOString(),
    });
  } catch (error) {
    logger.error("POST /api/predictions error", {
      module: LOG_MODULES.API.PREDICTIONS,
      ...formatError(error),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
