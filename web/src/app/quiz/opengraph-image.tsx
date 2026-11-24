import {
  createOgImageResponse,
  OG_SIZE,
} from "@/shared/lib/og-image/createOgImageResponse";

export const runtime = "nodejs";
export const alt = "今日の投資クイズに挑戦";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return createOgImageResponse({
    title: "今日の投資クイズに挑戦",
    badge: "デイリークイズ",
    subtitle: "毎日3問で投資判断力を鍛えよう",
  });
}
