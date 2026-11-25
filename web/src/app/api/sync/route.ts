/**
 * 同期API
 * ゲスト時のデータをログイン後にサーバーに同期
 *
 * v2: quiz_type対応（3問クイズ）
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/api/supabase/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import type {
  DiagnosisInput,
  DiagnosisAIResult,
  Json,
  QuizType,
} from "@/types/supabase";
import { EXPERIENCE_CONFIG } from "@/shared/config";
import { grantExperience } from "@/shared/lib/experience";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";

interface SyncPayload {
  diagnosis?: {
    input: DiagnosisInput;
    result: DiagnosisAIResult;
    createdAt: string;
  };
  quizAttempts?: {
    quizDate: string;
    quizType?: QuizType; // 新形式: quiz_type追加
    selectedOptionId: number;
    isCorrect: boolean;
    createdAt: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック（必須）
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const payload: SyncPayload = await request.json();
    let totalExpGained = 0;
    let syncedDiagnosis = false;
    let syncedQuizAttempts = 0;

    // 診断データの同期
    if (payload.diagnosis) {
      const { input, result } = payload.diagnosis;

      // 既存の診断があるか確認
      const { data: existing } = await supabase
        .from("diagnostics")
        .select("id")
        .eq("user_id", user.id)
        .single();

      // 既存がなければ保存
      if (!existing) {
        const { error: diagnosisError } = await supabase
          .from("diagnostics")
          .insert({
            user_id: user.id,
            ai_result: {
              ...result,
              inputData: input,
            } as unknown as Json,
          });

        if (!diagnosisError) {
          syncedDiagnosis = true;

          // プロフィールの投資スタイルを更新
          await supabase
            .from("profiles")
            .update({
              investment_style: result.investorType,
            })
            .eq("id", user.id);
        }
      }
    }

    // クイズ回答の同期
    if (payload.quizAttempts && payload.quizAttempts.length > 0) {
      for (const attempt of payload.quizAttempts) {
        // quiz_typeがない場合は'news'をデフォルトに（旧形式対応）
        const quizType = attempt.quizType || "news";

        // 重複チェック（quiz_typeも含めて）
        const { data: existing } = await supabase
          .from("quiz_attempts")
          .select("id")
          .eq("user_id", user.id)
          .eq("quiz_date", attempt.quizDate)
          .eq("quiz_type", quizType)
          .single();

        if (!existing) {
          const { error: insertError } = await supabase
            .from("quiz_attempts")
            .insert({
              user_id: user.id,
              quiz_date: attempt.quizDate,
              quiz_type: quizType,
              is_correct: attempt.isCorrect,
              choice_selected: attempt.selectedOptionId,
            });

          if (!insertError) {
            syncedQuizAttempts++;
            if (attempt.isCorrect) {
              totalExpGained += EXPERIENCE_CONFIG.PER_CORRECT;
            }
          }
        }
      }

      // 経験値を一括付与
      await grantExperience(createAdminClient(), user.id, totalExpGained);
    }

    return NextResponse.json({
      success: true,
      syncedDiagnosis,
      syncedQuizAttempts,
      totalExpGained,
    });
  } catch (error) {
    logger.error("Sync API error", {
      module: LOG_MODULES.API.SYNC,
      ...formatError(error),
    });
    return NextResponse.json(
      { error: "同期中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
