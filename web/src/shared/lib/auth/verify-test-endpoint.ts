import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/shared/lib/logger";
import type { LogModule } from "@/shared/lib/log-modules";

export function verifyTestEndpoint(
  request: NextRequest,
  logModule: LogModule,
): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    logger.warn("Test API called in production environment", {
      module: logModule,
    });
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 },
    );
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logger.error("CRON_SECRET is not configured", { module: logModule });
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
