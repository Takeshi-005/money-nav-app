import {
  createOgImageResponse,
  OG_SIZE,
} from "@/shared/lib/og-image/createOgImageResponse";

export const runtime = "nodejs";
export const alt = "投資家タイプ別ガイド - 8つの投資スタイルを学ぶ";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return createOgImageResponse({
    title: "投資家タイプ別ガイド",
    badge: "8タイプの投資スタイル",
    subtitle: "投資哲学・学習ステップ・推奨書籍を解説",
  });
}
