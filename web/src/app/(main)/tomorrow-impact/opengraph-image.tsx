import {
  createOgImageResponse,
  OG_SIZE,
} from "@/shared/lib/og-image/createOgImageResponse";

export const runtime = "nodejs";
export const alt = "明日の好悪材料分析 | 適時開示から学ぶ翌営業日の相場材料";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return createOgImageResponse({
    title: "明日の好悪材料分析",
    subtitle: "適時開示から学ぶ翌営業日の相場材料",
    footer: "money-nav.com",
  });
}
