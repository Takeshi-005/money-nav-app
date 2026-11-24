import {
  createOgImageResponse,
  OG_SIZE,
} from "@/shared/lib/og-image/createOgImageResponse";
import { BRAND, BRAND_TITLE_DEFAULT } from "@/shared/config";

export const runtime = "nodejs";
export const alt = BRAND_TITLE_DEFAULT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return createOgImageResponse({
    title: BRAND.NAME,
    subtitle: BRAND.TAGLINE,
    footer: "money-nav.com",
  });
}
