/**
 * ロードマップ自己申告API（ログインユーザーのDB永続化）
 * GET: 口座開設/初購入フラグを取得
 * POST: 指定フラグに「今」を記録（既に記録済みなら上書きしない）
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/api/supabase/server";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";
import { formatError } from "@/shared/lib/error-formatter";
import { SUPABASE_ERROR_CODES } from "@/shared/lib/supabase-errors";

interface RoadmapFlagsResponse {
  accountOpenedAt: string | null;
  firstPurchaseAt: string | null;
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
      .from("profiles")
      .select("account_opened_at, first_purchase_at")
      .eq("id", user.id)
      .single();

    if (error && error.code !== SUPABASE_ERROR_CODES.NO_ROWS) {
      throw error;
    }

    return NextResponse.json({
      accountOpenedAt: data?.account_opened_at ?? null,
      firstPurchaseAt: data?.first_purchase_at ?? null,
    } satisfies RoadmapFlagsResponse);
  } catch (error) {
    logger.error("Get roadmap flags error", {
      module: LOG_MODULES.API.ROADMAP,
      ...formatError(error),
    });
    return NextResponse.json(
      { error: "ロードマップ情報の取得に失敗しました" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = (await request.json()) as { type?: unknown };
    if (body.type !== "account" && body.type !== "firstPurchase") {
      return NextResponse.json({ error: "無効なtypeです" }, { status: 400 });
    }

    const { data: current, error: readError } = await supabase
      .from("profiles")
      .select("account_opened_at, first_purchase_at")
      .eq("id", user.id)
      .single();

    if (readError && readError.code !== SUPABASE_ERROR_CODES.NO_ROWS) {
      throw readError;
    }

    const now = new Date().toISOString();
    const alreadySet =
      body.type === "account"
        ? current?.account_opened_at
        : current?.first_purchase_at;

    if (!alreadySet) {
      const patch: { account_opened_at?: string; first_purchase_at?: string } =
        body.type === "account"
          ? { account_opened_at: now }
          : { first_purchase_at: now };
      const { error: updateError } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", user.id);
      if (updateError) {
        throw updateError;
      }
    }

    return NextResponse.json({
      accountOpenedAt:
        body.type === "account"
          ? (current?.account_opened_at ?? now)
          : (current?.account_opened_at ?? null),
      firstPurchaseAt:
        body.type === "firstPurchase"
          ? (current?.first_purchase_at ?? now)
          : (current?.first_purchase_at ?? null),
    } satisfies RoadmapFlagsResponse);
  } catch (error) {
    logger.error("Report roadmap step error", {
      module: LOG_MODULES.API.ROADMAP,
      ...formatError(error),
    });
    return NextResponse.json(
      { error: "ロードマップの更新に失敗しました" },
      { status: 500 },
    );
  }
}
