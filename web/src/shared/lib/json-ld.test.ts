import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./json-ld";

describe("serializeJsonLd", () => {
  it("script を閉じる文字列を含んでも script の外に出ない", () => {
    const result = serializeJsonLd({
      headline: "</script><script>alert(1)</script>",
    });
    expect(result).not.toContain("</script>");
    expect(result).not.toContain("<");
  });

  it("元の値に戻せる", () => {
    const data = { name: "A & B <C>", text: "改行\u2028あり" };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });
});
