import { describe, it, expect } from "vitest";
import { normalizePagePath } from "./normalize-path";

const SITE = "https://money-nav.com";

describe("normalizePagePath", () => {
  it("トップページ（末尾slash付き）は / になる", () => {
    expect(normalizePagePath("https://money-nav.com/", SITE)).toBe("/");
  });

  it("通常のサブパスはドメイン部分が除去される", () => {
    expect(
      normalizePagePath("https://money-nav.com/news-articles/2026-04-20", SITE),
    ).toBe("/news-articles/2026-04-20");
  });

  it("siteUrl 末尾の / 有無を吸収する", () => {
    expect(normalizePagePath("https://money-nav.com/dashboard", `${SITE}/`)).toBe(
      "/dashboard",
    );
  });

  it("ドメイン完全一致でも path 部分が空なら / にする", () => {
    expect(normalizePagePath(SITE, SITE)).toBe("/");
  });

  it("siteUrl と一致しない場合はそのまま返す", () => {
    expect(
      normalizePagePath("https://other-domain.com/page", SITE),
    ).toBe("https://other-domain.com/page");
  });
});
