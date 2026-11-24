/**
 * 診断API
 * POST: 診断実行 → Gemini API → Supabase保存
 * GET: 診断結果を取得
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/api/supabase/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { generateDiagnosis } from "@/shared/api/gemini";
import type { DiagnosisInput, DiagnosisAIResult, Json } from "@/types/supabase";
import { EXPERIENCE_CONFIG } from "@/shared/config";
import { grantExperience } from "@/shared/lib/experience";
import { isRateLimitError } from "@/shared/lib/api-errors";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";
import { SUPABASE_ERROR_CODES } from "@/shared/lib/supabase-errors";
import {
  isValidDiagnosisInput,
  buildDiagnosisCacheKey,
} from "@/entities/diagnosis";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = (await request.json()) as Partial<DiagnosisInput>;

    if (!isValidDiagnosisInput(body)) {
      return NextResponse.json({ error: "無効な入力値です" }, { status: 400 });
    }
    const input: DiagnosisInput = body;

    const answerKey = buildDiagnosisCacheKey(input);

    const adminSupabase = createAdminClient();

    const { data: cached } = await adminSupabase
      .from("diagnosis_cache")
      .select("ai_result")
      .eq("answer_key", answerKey)
      .maybeSingle();

    let result: DiagnosisAIResult;

    if (cached) {
      result = cached.ai_result as unknown as DiagnosisAIResult;
    } else {
      result = await generateDiagnosis(input);
      await adminSupabase.from("diagnosis_cache").insert({
        answer_key: answerKey,
        ai_result: result as unknown as Json,
      });
    }

    if (user) {
      const { error: diagnosisError } = await supabase
        .from("diagnostics")
        .upsert(
          {
            user_id: user.id,
            ai_result: {
              ...result,
              inputData: input,
            } as unknown as Json,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (diagnosisError) {
        logger.error("Diagnosis save error", {
          module: LOG_MODULES.API.DIAGNOSIS,
          error: diagnosisError.message,
        });
        throw diagnosisError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ investment_style: result.investorType })
        .eq("id", user.id);

      if (profileError) {
        logger.error("Profile update error", {
          module: LOG_MODULES.API.DIAGNOSIS,
          error: profileError.message,
        });
      }

      await grantExperience(
        supabase,
        user.id,
        EXPERIENCE_CONFIG.DIAGNOSIS_BONUS,
      );
    }

    return NextResponse.json({
      ...result,
      isGuest: !user,
    });
  } catch (error) {
    logger.error("Diagnosis API error", {
      module: LOG_MODULES.API.DIAGNOSIS,
      ...formatError(error),
    });

    if (isRateLimitError(error)) {
      return NextResponse.json(
        {
          error:
            "AIサービスが混雑しています。しばらく待ってから再度お試しください。",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "診断中にエラーが発生しました。時間をおいて再度お試しください。",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("diagnostics")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== SUPABASE_ERROR_CODES.NO_ROWS) {
      logger.error("Get diagnosis error", {
        module: LOG_MODULES.API.DIAGNOSIS,
        error: error.message,
      });
      throw error;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("experience")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      diagnosis: data?.ai_result ?? null,
      experience: profile?.experience ?? 0,
    });
  } catch (error) {
    logger.error("Get diagnosis error", {
      module: LOG_MODULES.API.DIAGNOSIS,
      ...formatError(error),
    });
    return NextResponse.json(
      { error: "診断結果の取得中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
