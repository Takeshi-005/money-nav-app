import {
  createOgImageResponse,
  OG_SIZE,
} from "@/shared/lib/og-image/createOgImageResponse";
import { BRAND } from "@/shared/config";

export const runtime = "nodejs";
export const alt = "AI投資スタイル診断 - あなたの投資スタイルは？";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return createOgImageResponse({
    title: "あなたの投資スタイルは？",
    badge: "AI投資スタイル診断",
    subtitle: "完全無料・登録不要・5分で完了 / 9つの質問で8タイプから分析",
    footer: BRAND.NAME,
  });
}
