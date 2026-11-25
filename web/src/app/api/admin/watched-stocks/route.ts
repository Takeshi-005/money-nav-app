import { NextResponse } from "next/server";
import { createAdminClient } from "@/shared/api/supabase/admin";
import { validateJpStockTicker } from "@/shared/api/market-data/jp-stock";
import { lookupJpCompanyName } from "@/shared/api/gemini/stock-lookup";
import { checkAdmin } from "@/shared/lib/auth";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("watched_stocks")
    .select(
      "id, ticker_code, company_name, is_active, next_earnings_date, created_at",
    )
    .order("created_at", { ascending: false });

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

  return NextResponse.json({ stocks: data });
}

export async function POST(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { ticker_code, next_earnings_date } = body as {
    ticker_code?: string;
    next_earnings_date?: string | null;
  };

  if (!ticker_code?.trim()) {
    return NextResponse.json(
      { error: "ticker_code は必須です" },
      { status: 400 },
    );
  }

  if (
    next_earnings_date != null &&
    next_earnings_date !== "" &&
    !DATE_FORMAT.test(next_earnings_date)
  ) {
    return NextResponse.json(
      { error: "next_earnings_date は YYYY-MM-DD 形式で指定してください" },
      { status: 400 },
    );
  }

  const trimmedTicker = ticker_code.trim().toUpperCase();
  const validation = await validateJpStockTicker(trimmedTicker);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  let companyName: string;
  try {
    companyName = await lookupJpCompanyName(trimmedTicker);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "銘柄名の取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("watched_stocks")
    .insert({
      ticker_code: trimmedTicker,
      company_name: companyName,
      next_earnings_date: next_earnings_date || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `ティッカーコード「${ticker_code}」は既に登録されています` },
        { status: 400 },
      );
    }
    logger.error("watched_stocks の操作に失敗しました", {
      module: LOG_MODULES.API.ADMIN_WATCHED_STOCKS,
      error: error.message,
    });
    return NextResponse.json(
      { error: "銘柄の操作に失敗しました" },
      { status: 500 },
    );
  }

  return NextResponse.json({ stock: data }, { status: 201 });
}
