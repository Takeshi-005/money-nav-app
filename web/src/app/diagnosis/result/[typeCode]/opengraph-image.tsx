import {
  createOgImageResponse,
  OG_SIZE,
} from "@/shared/lib/og-image/createOgImageResponse";
import type { InvestorTypeCode } from "@/types/supabase";
import { INVESTOR_TYPE_DATA, INVESTOR_TYPE_CODES } from "@/entities/diagnosis";
import { BRAND } from "@/shared/config";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";

interface Props {
  params: Promise<{ typeCode: string }>;
}

export function generateStaticParams() {
  return INVESTOR_TYPE_CODES.map((typeCode) => ({ typeCode: typeCode.toLowerCase() }));
}

export default async function Image({ params }: Props) {
  const { typeCode } = await params;
  const code = typeCode.toUpperCase() as InvestorTypeCode;
  const data = INVESTOR_TYPE_DATA[code];

  if (!data) {
    return createOgImageResponse({
      title: "AI投資スタイル診断",
      badge: BRAND.NAME,
      subtitle: "あなたの投資タイプを診断しよう",
    });
  }

  return createOgImageResponse({
    title: `あなたは「${data.name}」タイプ！`,
    badge: "AI投資スタイル診断",
    subtitle: data.subtitle,
    footer: "あなたのタイプも診断してみよう → money-nav.com/diagnosis",
  });
}
