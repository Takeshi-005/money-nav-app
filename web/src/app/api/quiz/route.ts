/**
 * クイズAPI
 * GET: 今日のクイズ取得（3問セット、未ログインでも取得可能）
 * POST: 回答送信 → 経験値付与（問題タイプ指定、未ログインでも回答可能）
 *
 * 新形式: 3問（news, basic, scenario）対応
 * 旧形式: 1問のみ（下位互換）
 * 難易度対応: LV1-10は事前生成、LV11+は動的生成+キャッシュ
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/api/supabase/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import type {
  QuizType,
  SingleQuiz,
  QuizAttemptsMap,
  DifficultyLevel,
} from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/types/database.types";
import {
  getDifficultyFromExperience,
  isLegacyFormat,
  convertLegacyToNew,
  isAllCorrect,
} from "@/entities/quiz";
import { generateDailyQuizzes, extractQuizSummaries } from "@/shared/api/gemini/quiz";
import { getTodayDateStringJST } from "@/shared/lib/date";
import { EXPERIENCE_CONFIG } from "@/shared/config";
import { grantExperience } from "@/shared/lib/experience";
import { isRateLimitError } from "@/shared/lib/api-errors";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";
import { SUPABASE_ERROR_CODES } from "@/shared/lib/supabase-errors";

const QUIZ_TYPES: QuizType[] = [
  "news",
  "basic",
  "scenario",
  "psychology",
  "history",
];

async function fetchUserDifficulty(
  supabase: SupabaseClient,
  userId: string | null,
): Promise<DifficultyLevel> {
  if (!userId) {
    return "beginner";
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("experience")
    .eq("id", userId)
    .single();
  return getDifficultyFromExperience(profile?.experience ?? 0);
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const today = getTodayDateStringJST();
    const difficulty = await fetchUserDifficulty(supabase, user?.id ?? null);

    // クイズデータを取得
    let quiz: { date: string; content: unknown } | null = null;

    if (difficulty === "beginner") {
      const { data, error: quizError } = await supabase
        .from("daily_quizzes")
        .select("*")
        .eq("date", today)
        .eq("is_published", true)
        .single();

      if (quizError && quizError.code !== SUPABASE_ERROR_CODES.NO_ROWS) {
        throw quizError;
      }

      quiz = data;
    } else {
      // 中級・上級: キャッシュから取得、なければ動的生成
      quiz = await getOrGenerateQuiz(supabase, today, difficulty);
    }

    if (!quiz) {
      return NextResponse.json({
        quizzes: null,
        attempts: {},
        isGuest: !user,
        difficulty,
      });
    }

    // コンテンツを解析（新形式/旧形式対応）
    const rawContent = quiz.content as unknown;
    let quizzes: SingleQuiz[];

    if (isLegacyFormat(rawContent)) {
      quizzes = convertLegacyToNew(rawContent);
    } else {
      const newContent = rawContent as { quizzes: SingleQuiz[] };
      quizzes = newContent.quizzes;
    }

    // 認証済みの場合のみ回答履歴をチェック
    const attempts: QuizAttemptsMap = {
      news: { answered: false },
      basic: { answered: false },
      scenario: { answered: false },
      psychology: { answered: false },
      history: { answered: false },
    };

    if (user) {
      const { data: userAttempts, error: attemptError } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("user_id", user.id)
        .eq("quiz_date", today);

      if (attemptError) {
        throw attemptError;
      }

      for (const attempt of userAttempts || []) {
        const quizType = ((attempt as { quiz_type?: string }).quiz_type ||
          "news") as QuizType;
        attempts[quizType] = {
          answered: true,
          isCorrect: attempt.is_correct,
          selectedOptionId: attempt.choice_selected,
          gainedExp: attempt.is_correct ? EXPERIENCE_CONFIG.PER_CORRECT : 0,
        };
      }
    }

    // 未回答の問題は正解を隠す
    const quizzesForResponse = quizzes.map((q) => {
      const quizType = q.quiz_type;
      if (attempts[quizType]?.answered) {
        return q;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { correct_option_id, explanation, ...quizWithoutAnswer } = q;
      return quizWithoutAnswer;
    });

    // 用語辞典キーターム（解説文の内部リンク用）
    const { data: keyTerms } = await supabase
      .from("glossary_terms")
      .select("term, slug, definition")
      .order("term");

    // 全問正解ボーナス情報
    const answeredCount = Object.values(attempts).filter(
      (a) => a.answered,
    ).length;
    const correctCount = Object.values(attempts).filter(
      (a) => a.isCorrect,
    ).length;
    const allCorrectBonus =
      answeredCount === quizzes.length && correctCount === quizzes.length;

    return NextResponse.json({
      date: quiz.date,
      quizzes: quizzesForResponse,
      attempts,
      allCorrectBonus: allCorrectBonus
        ? EXPERIENCE_CONFIG.ALL_CORRECT_BONUS
        : 0,
      isGuest: !user,
      difficulty,
      keyTerms: keyTerms ?? [],
    });
  } catch (error) {
    logger.error("Get quiz error", {
      module: LOG_MODULES.API.QUIZ,
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
      { error: "クイズの取得中にエラーが発生しました" },
      { status: 500 },
    );
  }
}

async function getOrGenerateQuiz(
  supabase: SupabaseClient,
  date: string,
  difficulty: DifficultyLevel,
): Promise<{ date: string; content: unknown } | null> {
  // キャッシュから取得を試みる
  const { data: cached } = await supabase
    .from("quiz_cache")
    .select("*")
    .eq("date", date)
    .eq("difficulty", difficulty)
    .single();

  if (cached) {
    return { date: cached.date, content: cached.content };
  }

  // キャッシュにない場合は動的生成
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 7);
  const pastDateString = pastDate.toISOString().split("T")[0];

  const { data: recentQuizzes } = await supabase
    .from("quiz_cache")
    .select("content")
    .gte("date", pastDateString)
    .lt("date", date)
    .eq("difficulty", difficulty);

  const recentSummaries = extractQuizSummaries(recentQuizzes);
  const { quizData } = await generateDailyQuizzes(recentSummaries, difficulty);

  // キャッシュに保存（RLSにINSERTポリシーがないため管理者クライアントを使用）
  const adminClient = createAdminClient();
  await adminClient.from("quiz_cache").insert({
    date,
    difficulty,
    content: { quizzes: quizData.quizzes } as unknown as Json,
  });

  return { date, content: { quizzes: quizData.quizzes } };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { quizType, selectedOptionId } = body as {
      quizType?: QuizType;
      selectedOptionId: number;
    };

    if (typeof selectedOptionId !== "number") {
      return NextResponse.json({ error: "無効な回答です" }, { status: 400 });
    }

    const targetQuizType: QuizType = quizType || "news";

    if (!QUIZ_TYPES.includes(targetQuizType)) {
      return NextResponse.json(
        { error: "無効なクイズタイプです" },
        { status: 400 },
      );
    }

    const today = getTodayDateStringJST();
    const difficulty = await fetchUserDifficulty(supabase, user?.id ?? null);

    // 難易度に応じてクイズ取得先を分岐
    let quiz: { date: string; content: unknown } | null = null;

    if (difficulty === "beginner") {
      const { data, error: quizError } = await supabase
        .from("daily_quizzes")
        .select("*")
        .eq("date", today)
        .eq("is_published", true)
        .single();

      if (quizError) {
        if (quizError.code === SUPABASE_ERROR_CODES.NO_ROWS) {
          return NextResponse.json(
            { error: "今日のクイズがありません" },
            { status: 404 },
          );
        }
        throw quizError;
      }
      quiz = data;
    } else {
      quiz = await getOrGenerateQuiz(supabase, today, difficulty);
    }

    if (!quiz) {
      return NextResponse.json(
        { error: "今日のクイズがありません" },
        { status: 404 },
      );
    }

    // コンテンツを解析
    const rawContent = quiz.content as unknown;
    let quizzes: SingleQuiz[];

    if (isLegacyFormat(rawContent)) {
      quizzes = convertLegacyToNew(rawContent);
    } else {
      const newContent = rawContent as { quizzes: SingleQuiz[] };
      quizzes = newContent.quizzes;
    }

    // 指定されたタイプのクイズを取得
    const targetQuiz = quizzes.find((q) => q.quiz_type === targetQuizType);
    if (!targetQuiz) {
      return NextResponse.json(
        { error: "指定されたクイズが見つかりません" },
        { status: 404 },
      );
    }

    const isCorrect = selectedOptionId === targetQuiz.correct_option_id;
    let gainedExp = isCorrect ? EXPERIENCE_CONFIG.PER_CORRECT : 0;
    let allCorrectBonus = 0;

    // 認証済みの場合のみDBに保存・経験値付与
    if (user) {
      // 既に回答済みか確認
      const { data: existingAttempt } = await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("user_id", user.id)
        .eq("quiz_date", today)
        .eq("quiz_type", targetQuizType)
        .single();

      if (existingAttempt) {
        return NextResponse.json(
          { error: "既に回答済みです" },
          { status: 400 },
        );
      }

      // 回答を保存
      const { error: insertError } = await supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          quiz_date: today,
          quiz_type: targetQuizType,
          is_correct: isCorrect,
          choice_selected: selectedOptionId,
        });

      if (insertError) {
        throw insertError;
      }

      if (isCorrect) {
        const { data: allAttempts } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("user_id", user.id)
          .eq("quiz_date", today);

        const attemptsByType = new Map<string, boolean>(
          (allAttempts || []).map((a) => [
            (a as unknown as { quiz_type?: string }).quiz_type || "news",
            a.is_correct,
          ]),
        );

        if (isAllCorrect(quizzes, attemptsByType)) {
          allCorrectBonus = EXPERIENCE_CONFIG.ALL_CORRECT_BONUS;
          gainedExp += allCorrectBonus;
        }
      }

      // 経験値を付与
      await grantExperience(supabase, user.id, gainedExp);
    }

    return NextResponse.json({
      isCorrect,
      correctOptionId: targetQuiz.correct_option_id,
      explanation: targetQuiz.explanation,
      gainedExp: isCorrect ? EXPERIENCE_CONFIG.PER_CORRECT : 0,
      allCorrectBonus,
      isGuest: !user,
    });
  } catch (error) {
    logger.error("Submit answer error", {
      module: LOG_MODULES.API.QUIZ,
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
      { error: "回答の送信中にエラーが発生しました" },
      { status: 500 },
    );
  }
}
