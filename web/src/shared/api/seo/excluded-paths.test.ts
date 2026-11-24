import { describe, it, expect } from "vitest";
import { isExcludedSeoPath } from "./excluded-paths";

describe("isExcludedSeoPath", () => {
  it("/admin 自体は除外する", () => {
    expect(isExcludedSeoPath("/admin")).toBe(true);
  });

  it("/admin 配下のパスは除外する", () => {
    expect(isExcludedSeoPath("/admin/disclosures")).toBe(true);
    expect(isExcludedSeoPath("/admin/seo-audit")).toBe(true);
  });

  it("トップページは除外しない", () => {
    expect(isExcludedSeoPath("/")).toBe(false);
  });

  it("通常の公開ページは除外しない", () => {
    expect(isExcludedSeoPath("/news-articles")).toBe(false);
    expect(isExcludedSeoPath("/glossary/per")).toBe(false);
  });

  it("プレフィックスが部分一致する別パスは除外しない", () => {
    expect(isExcludedSeoPath("/administrator")).toBe(false);
    expect(isExcludedSeoPath("/admin-guide")).toBe(false);
  });
});
