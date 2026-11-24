import { describe, it, expect } from "vitest";
import { decodeGoogleNewsUrl } from "../decode-google-news-url";

const GOOGLE_NEWS_PREFIX = "https://news.google.com/rss/articles/";

function toUrlSafeBase64(binary: string): string {
  return Buffer.from(binary, "binary")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("decodeGoogleNewsUrl", () => {
  it("Google News URLに埋め込まれた実URLをデコードして返す", () => {
    const realUrl = "https://example.com/articles/12345";
    // Protobufフィールド風のプレフィックス/サフィックスで実URLを挟む
    const payload =
      `\x08\x13\x12${ 
      String.fromCharCode(realUrl.length) 
      }${realUrl 
      }\x1a\x02en`;
    const base64 = toUrlSafeBase64(payload);
    const input = `${GOOGLE_NEWS_PREFIX}${base64}?oc=5`;

    expect(decodeGoogleNewsUrl(input)).toBe(realUrl);
  });

  it("Google News URL以外は変更せずそのまま返す", () => {
    const url = "https://example.com/news/article-1";
    expect(decodeGoogleNewsUrl(url)).toBe(url);
  });

  it("空文字列はそのまま返す", () => {
    expect(decodeGoogleNewsUrl("")).toBe("");
  });

  it("不正なBase64ペイロードの場合は元のGoogle News URLをフォールバックで返す", () => {
    const invalidUrl = `${GOOGLE_NEWS_PREFIX}!!!not-base64!!!`;
    expect(decodeGoogleNewsUrl(invalidUrl)).toBe(invalidUrl);
  });

  it("デコード後にURLが含まれない場合は元のGoogle News URLをフォールバックで返す", () => {
    const noUrlPayload = toUrlSafeBase64("\x08\x13\x12\x05hello");
    const input = `${GOOGLE_NEWS_PREFIX}${noUrlPayload}`;
    expect(decodeGoogleNewsUrl(input)).toBe(input);
  });

  it("現行のGoogle News URL（二重エンコード形式）はデコード不可で元URLをそのまま返す", () => {
    // Google Newsは内部ペイロードが暗号化バイナリのため binary scan では解けない
    // フォールバックとして元URLを返し、prompt.ts 側で newsLinks から除外される
    const googleNewsUrl =
      "https://news.google.com/rss/articles/CBMiiwFBVV95cUxNcktzMkRVTmx5NGlibHNxRGtlclVnRjBtV191VjJTVHJ4VTZNN2ZnMXJHaTFSdnhCeGwtLWlTRUJueGtXeHBVdVVrc2k2VGRubi1lX0pBbXo1LXlldmlvZzdvQjc0dHhtQXV5T1lSRGMyNDZ6anFzSEdSb3RhdVVuS1E1ZDFLdUxIUHRN?oc=5&hl=ja&gl=JP&ceid=JP:ja";
    const result = decodeGoogleNewsUrl(googleNewsUrl);
    expect(result).toBe(googleNewsUrl);
  });
});
