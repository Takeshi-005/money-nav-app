import { NextResponse } from "next/server";
import { createClient } from "@/shared/api/supabase/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";
import type { PredictionDirection } from "@/types/supabase";

const HISTORY_LIMIT = 30;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    const { data: predictions } = await adminSupabase
      .from("predictions")
      .select("date, prediction, is_correct, prediction_results(actual_movement)")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(HISTORY_LIMIT);

    const history = (predictions ?? []).map((p) => {
      const result = Array.isArray(p.prediction_results)
        ? p.prediction_results[0]
        : p.prediction_results;
      return {
        date: p.date,
        prediction: p.prediction as PredictionDirection,
        actualMovement: result?.actual_movement as PredictionDirection | undefined,
        isCorrect: p.is_correct ?? undefined,
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    logger.error("GET /api/predictions/history error", {
      module: LOG_MODULES.API.PREDICTIONS,
      ...formatError(error),
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
