import {
  createOgImageResponse,
  OG_SIZE,
} from "@/shared/lib/og-image/createOgImageResponse";

export const runtime = "nodejs";
export const alt = "投資用語辞典 - 初心者向けにわかりやすく解説";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return createOgImageResponse({
    title: "投資用語辞典",
    badge: "初心者向け",
    subtitle: "PER・PBR・配当利回りなど、株式投資の基礎用語をわかりやすく解説",
  });
}
