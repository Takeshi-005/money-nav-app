import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// モジュールを再インポートするためのヘルパー
let rateLimitedCall: <T>(fn: () => Promise<T>) => Promise<T>;
let callGeminiWithRetry: <T>(fn: () => Promise<T>) => Promise<T>;
let RATE_LIMIT_DELAY_MS: number;
let logger: {
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
};

// loggerをモック
vi.mock("@/shared/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// p-retryをモック
vi.mock("p-retry", () => ({
  default: async (
    fn: () => Promise<unknown>,
    options?: {
      retries?: number;
      onFailedAttempt?: (error: Error & { attemptNumber: number }) => void;
    },
  ) => {
    let lastError: unknown;
    const maxAttempts = (options?.retries ?? 0) + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts && options?.onFailedAttempt) {
          const failedError = error as Error;
          const errorWithAttempt = Object.assign(failedError, {
            attemptNumber: attempt,
          });
          options.onFailedAttempt(errorWithAttempt);
        }
      }
    }
    throw lastError;
  },
}));

describe("rateLimitedCall", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const retryModule = await import("./retry");
    const loggerModule = await import("@/shared/lib/logger");
    rateLimitedCall = retryModule.rateLimitedCall;
    callGeminiWithRetry = retryModule.callGeminiWithRetry;
    RATE_LIMIT_DELAY_MS = retryModule.RATE_LIMIT_DELAY_MS;
    logger = loggerModule.logger as typeof logger;
    logger.warn.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
    vi.resetModules();
  });

  describe("正常系", () => {
    it("初回呼び出しは即座に実行される", async () => {
      const mockFn = vi.fn(async () => "success");

      const promise = rateLimitedCall(mockFn);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("1秒以上空けた呼び出しは待機なしで実行される", async () => {
      const mockFn = vi.fn(async () => "success");

      const promise1 = rateLimitedCall(mockFn);
      await vi.runAllTimersAsync();
      await promise1;

      await vi.advanceTimersByTimeAsync(RATE_LIMIT_DELAY_MS + 1000);

      const promise2 = rateLimitedCall(mockFn);
      await vi.runAllTimersAsync();
      await promise2;

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("1秒未満での呼び出しは残り時間待機する", async () => {
      const mockFn = vi.fn(async () => "success");

      await rateLimitedCall(mockFn);
      vi.advanceTimersByTime(500);

      const promise = rateLimitedCall(mockFn);
      expect(mockFn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(RATE_LIMIT_DELAY_MS - 500);
      await promise;

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("境界値", () => {
    it("正確に1秒後の呼び出しは待機なしで実行される", async () => {
      const mockFn = vi.fn(async () => "success");

      const promise1 = rateLimitedCall(mockFn);
      await vi.runAllTimersAsync();
      await promise1;

      await vi.advanceTimersByTimeAsync(RATE_LIMIT_DELAY_MS);

      const promise2 = rateLimitedCall(mockFn);
      await vi.runAllTimersAsync();
      await promise2;

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});

describe("callGeminiWithRetry", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const retryModule = await import("./retry");
    rateLimitedCall = retryModule.rateLimitedCall;
    callGeminiWithRetry = retryModule.callGeminiWithRetry;
    RATE_LIMIT_DELAY_MS = retryModule.RATE_LIMIT_DELAY_MS;
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe("正常系", () => {
    it("初回呼び出しで成功した場合、リトライしない", async () => {
      const mockFn = vi.fn(async () => "success");

      const promise = callGeminiWithRetry(mockFn);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it("2回目で成功した場合、1回リトライする", async () => {
      let callCount = 0;
      const mockFn = vi.fn(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("First attempt failed");
        }
        return "success";
      });

      const promise = callGeminiWithRetry(mockFn);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(logger.warn).toHaveBeenCalledWith("Gemini API リトライ中", {
        module: "lib/gemini/retry",
        attemptNumber: 1,
        totalAttempts: 3,
        message: "First attempt failed",
      });
    });

    it("3回目で成功した場合、2回リトライする", async () => {
      let callCount = 0;
      const mockFn = vi.fn(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error(`Attempt ${callCount} failed`);
        }
        return "success";
      });

      const promise = callGeminiWithRetry(mockFn);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(3);
      expect(logger.warn).toHaveBeenCalledTimes(2);
    });
  });

  describe("異常系", () => {
    it("4回すべて失敗した場合、エラーをスローする", async () => {
      const mockFn = vi.fn(async () => {
        throw new Error("Always fails");
      });

      let errorCaught = false;
      let caughtError: unknown;

      const promise = callGeminiWithRetry(mockFn);
      promise.catch(() => {});

      try {
        await vi.runAllTimersAsync();
        await promise;
      } catch (error) {
        errorCaught = true;
        caughtError = error;
      }

      expect(errorCaught).toBe(true);
      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toBe("Always fails");
      expect(mockFn).toHaveBeenCalledTimes(4);
      expect(logger.warn).toHaveBeenCalledTimes(3);
    });
  });
});
