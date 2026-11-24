/**
 * Gemini API レート制限・リトライ処理
 */
import pRetry from "p-retry";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

export const RATE_LIMIT_DELAY_MS = 1000; // Vertex AI は RPM 制限が実質なし
let lastCallTime = 0;

export async function rateLimitedCall<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;

  if (timeSinceLastCall < RATE_LIMIT_DELAY_MS) {
    await new Promise((r) =>
      setTimeout(r, RATE_LIMIT_DELAY_MS - timeSinceLastCall),
    );
  }

  lastCallTime = Date.now();
  return fn();
}

export async function callGeminiWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  return pRetry(() => rateLimitedCall(fn), {
    retries: 3,
    minTimeout: 1000,
    maxTimeout: 10000,
    onFailedAttempt: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn("Gemini API リトライ中", {
        module: LOG_MODULES.LIB.GEMINI_RETRY,
        attemptNumber: error.attemptNumber,
        totalAttempts: 3,
        message,
      });
    },
  });
}
