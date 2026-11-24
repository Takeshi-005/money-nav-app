import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger, logError } from "./logger";
import type { StructuredLog } from "./logger";

describe("logger", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("severityに応じてconsoleの正しいメソッドにJSON形式で出力する", () => {
    logger.info("info-msg");
    logger.warn("warn-msg");
    logger.error("error-msg");

    const infoOutput = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as StructuredLog;
    const warnOutput = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string) as StructuredLog;
    const errorOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string) as StructuredLog;

    expect(infoOutput.severity).toBe("INFO");
    expect(warnOutput.severity).toBe("WARNING");
    expect(errorOutput.severity).toBe("ERROR");
  });

  it("必須フィールド・ISO 8601タイムスタンプ・contextを正しく含む", () => {
    const context = { userId: "123", nested: { id: 1 } };
    logger.info("test", context);

    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0] as string) as StructuredLog;

    expect(parsed.message).toBe("test");
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(parsed.context).toEqual(context);
  });
});

describe("logError", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("Errorオブジェクトからmessageとstackをcontextへ抽出する（stackは5行に制限）", () => {
    const error = new Error("Test error");
    error.stack = Array.from({ length: 20 }, (_, i) => `  at line${i + 1}`).join("\n");

    logError("発生", error, "internal", { module: "test" });

    const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string) as StructuredLog;
    expect(parsed.context?.errorMessage).toBe("Test error");
    expect((parsed.context?.errorStack as string).split("\n").length).toBeLessThanOrEqual(5);
    expect(parsed.context?.module).toBe("test");
  });

  it("Error以外は文字列化してstackは含めない", () => {
    logError("発生", "raw-string", "internal");

    const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string) as StructuredLog;
    expect(parsed.context?.errorMessage).toBe("raw-string");
    expect(parsed.context?.errorStack).toBeUndefined();
  });

  it("ユーザー由来エラー（validation/notFound/rateLimit）はisUserError=true", () => {
    logError("ユーザーエラー", new Error("e"), "validation");
    const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string) as StructuredLog;
    expect(parsed.context?.isUserError).toBe(true);
  });

  it("システム由来エラー（database/external/internal）はisUserError=false", () => {
    logError("システムエラー", new Error("e"), "database");
    const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0] as string) as StructuredLog;
    expect(parsed.context?.isUserError).toBe(false);
  });
});
