/**
 * クイズ履歴API
 * GET: 過去のクイズ回答履歴と統計情報を取得
 *
 * クエリパラメータ:
 * - limit: 取得する日数（デフォルト: 全件）
 * - detailed: 問題詳細を含めるか（デフォルト: false）
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/api/supabase/server";
import type { QuizType, SingleQuiz } from "@/types/supabase";
import {
  isLegacyFormat,
  convertLegacyToNew,
  calculateQuizStats,
} from "@/entities/quiz";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";

interface QuizHistoryItem {
  quizType: QuizType;
  isCorrect: boolean;
  selectedOptionId: number;
  question?: string;
  options?: { id: number; text: string }[];
  correctOptionId?: number;
  explanation?: string;
  title?: string;
}

interface DailyHistory {
  date: string;
  quizzes: QuizHistoryItem[];
  correctCount: number;
  totalQuizzes: number;
}

const GUEST_QUIZ_DATES_LIMIT = 30;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!, 10)
      : null;
    const detailed = searchParams.get("detailed") === "true";

    // ログインしていない場合は空の履歴を返す（クライアント側でlocalStorageを使用）
    if (!user) {
      // ゲスト用: daily_quizzes の日付一覧のみ返す（クライアント側で照合に使用）
      const { data: quizDates, error: quizError } = await supabase
        .from("daily_quizzes")
        .select("date, content")
        .order("date", { ascending: false })
        .limit(limit || GUEST_QUIZ_DATES_LIMIT);

      if (quizError) {
        throw quizError;
      }

      // クイズデータをマップに変換
      const quizDataMap: Record<string, SingleQuiz[]> = {};
      for (const quiz of quizDates || []) {
        const rawContent = quiz.content as unknown;
        let quizzes: SingleQuiz[];
        if (isLegacyFormat(rawContent)) {
          quizzes = convertLegacyToNew(rawContent);
        } else {
          const newContent = rawContent as { quizzes: SingleQuiz[] };
          quizzes = newContent.quizzes;
        }
        quizDataMap[quiz.date] = quizzes;
      }

      return NextResponse.json({
        isGuest: true,
        stats: {
          totalAttempts: 0,
          correctCount: 0,
          accuracy: 0,
          streakDays: 0,
          perfectDays: 0,
        },
        history: [],
        quizDataMap,
      });
    }

    // ログインユーザー: 回答履歴を取得
    const query = supabase
      .from("quiz_attempts")
      .select("quiz_date, quiz_type, is_correct, choice_selected, created_at")
      .eq("user_id", user.id)
      .order("quiz_date", { ascending: false })
      .order("created_at", { ascending: true });

    const { data: attempts, error: attemptError } = await query;

    if (attemptError) {
      throw attemptError;
    }

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({
        isGuest: false,
        stats: {
          totalAttempts: 0,
          correctCount: 0,
          accuracy: 0,
          streakDays: 0,
          perfectDays: 0,
        },
        history: [],
      });
    }

    // 日付ごとにグループ化
    const dateGroups = new Map<
      string,
      {
        quizType: QuizType;
        isCorrect: boolean;
        selectedOptionId: number;
      }[]
    >();

    for (const attempt of attempts) {
      const date = attempt.quiz_date;
      if (!dateGroups.has(date)) {
        dateGroups.set(date, []);
      }
      dateGroups.get(date)!.push({
        quizType: (attempt.quiz_type || "news") as QuizType,
        isCorrect: attempt.is_correct,
        selectedOptionId: attempt.choice_selected,
      });
    }

    const stats = calculateQuizStats(attempts);

    // 日付リストを作成
    const dates = Array.from(dateGroups.keys());
    const limitedDates = limit ? dates.slice(0, limit) : dates;

    // クイズの詳細情報を取得（detailed=true の場合）
    const quizDataMap: Record<string, SingleQuiz[]> = {};
    if (detailed && limitedDates.length > 0) {
      const { data: quizzes, error: quizError } = await supabase
        .from("daily_quizzes")
        .select("date, content")
        .in("date", limitedDates);

      if (quizError) {
        throw quizError;
      }

      for (const quiz of quizzes || []) {
        const rawContent = quiz.content as unknown;
        let quizList: SingleQuiz[];
        if (isLegacyFormat(rawContent)) {
          quizList = convertLegacyToNew(rawContent);
        } else {
          const newContent = rawContent as { quizzes: SingleQuiz[] };
          quizList = newContent.quizzes;
        }
        quizDataMap[quiz.date] = quizList;
      }
    }

    // 履歴を構築
    const history: DailyHistory[] = limitedDates.map((date) => {
      const dayAttempts = dateGroups.get(date) || [];
      const quizzes: QuizHistoryItem[] = dayAttempts.map((attempt) => {
        const item: QuizHistoryItem = {
          quizType: attempt.quizType,
          isCorrect: attempt.isCorrect,
          selectedOptionId: attempt.selectedOptionId,
        };

        // 詳細情報を追加
        if (detailed && quizDataMap[date]) {
          const quizDetail = quizDataMap[date].find(
            (q) => q.quiz_type === attempt.quizType,
          );
          if (quizDetail) {
            item.title = quizDetail.title;
            item.question = quizDetail.question;
            item.options = quizDetail.options;
            item.correctOptionId = quizDetail.correct_option_id;
            item.explanation = quizDetail.explanation;
          }
        }

        return item;
      });

      return {
        date,
        quizzes,
        correctCount: dayAttempts.filter((a) => a.isCorrect).length,
        totalQuizzes: dayAttempts.length,
      };
    });

    return NextResponse.json({
      isGuest: false,
      stats,
      history,
    });
  } catch (error) {
    logger.error("Get quiz history error", {
      module: LOG_MODULES.API.QUIZ_HISTORY,
      ...formatError(error),
    });
    return NextResponse.json(
      { error: "クイズ履歴の取得中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
