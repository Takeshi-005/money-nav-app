import { NextResponse } from "next/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { checkAdmin } from "@/shared/lib/auth";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { is_active, next_earnings_date } = body as {
    is_active?: boolean;
    next_earnings_date?: string | null;
  };

  const updates: {
    is_active?: boolean;
    next_earnings_date?: string | null;
  } = {};

  if (is_active !== undefined) {
    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "is_active は boolean が必要です" },
        { status: 400 },
      );
    }
    updates.is_active = is_active;
  }

  if (next_earnings_date !== undefined) {
    if (
      next_earnings_date !== null &&
      next_earnings_date !== "" &&
      !DATE_FORMAT.test(next_earnings_date)
    ) {
      return NextResponse.json(
        { error: "next_earnings_date は YYYY-MM-DD 形式で指定してください" },
        { status: 400 },
      );
    }
    updates.next_earnings_date = next_earnings_date || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "更新項目が指定されていません" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("watched_stocks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.error("watched_stocks の操作に失敗しました", {
      module: LOG_MODULES.API.ADMIN_WATCHED_STOCKS,
      error: error.message,
    });
    return NextResponse.json(
      { error: "銘柄の操作に失敗しました" },
      { status: 500 },
    );
  }

  return NextResponse.json({ stock: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("watched_stocks")
    .delete()
    .eq("id", id);

  if (error) {
    logger.error("watched_stocks の操作に失敗しました", {
      module: LOG_MODULES.API.ADMIN_WATCHED_STOCKS,
      error: error.message,
    });
    return NextResponse.json(
      { error: "銘柄の操作に失敗しました" },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
