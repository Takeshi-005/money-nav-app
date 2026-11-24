import "server-only";
import { createClient } from "@/shared/api/supabase/server";
import type { AuthUser } from "@/entities/session";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email ?? null,
      displayName: user.user_metadata?.full_name ?? user.email ?? null,
      photoURL: user.user_metadata?.avatar_url ?? null,
    };
  } catch (error) {
    logger.error("Failed to get current user", {
      module: LOG_MODULES.APP.LAYOUT,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
