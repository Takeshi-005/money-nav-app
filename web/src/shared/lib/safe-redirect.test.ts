import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "./safe-redirect";

describe("getSafeRedirectPath", () => {
  it("サイト内のパスはそのまま返す", () => {
    expect(getSafeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath("/quiz?date=2026-01-01#top")).toBe(
      "/quiz?date=2026-01-01#top",
    );
  });

  it("値がなければ既定のパスを返す", () => {
    expect(getSafeRedirectPath(null)).toBe("/dashboard");
    expect(getSafeRedirectPath(undefined, "/")).toBe("/");
    expect(getSafeRedirectPath("")).toBe("/dashboard");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "@evil.example",
    "evil.example",
    "javascript:alert(1)",
    "/\tevil",
    "/%0d%0aSet-Cookie:x",
  ])("外部へ飛ぶ値 %s は既定のパスにする", (value) => {
    const result = getSafeRedirectPath(value);
    expect(result.startsWith("/")).toBe(true);
    expect(result.startsWith("//")).toBe(false);
    expect(new URL(result, "https://money-nav.com").origin).toBe(
      "https://money-nav.com",
    );
  });
});
