"use client";

/**
 * Investor Avatar Component
 * 投資家タイプのピクセルアート画像をRPG風フレームで表示
 * サイズバリアント対応（sm: 64px, md: 100px, lg: 160px）
 */
import Image from "next/image";
import type { InvestorTypeCode } from "@/types/supabase";
import { getResultIcon } from "./ResultIcons";

// 画像が存在するタイプのマッピング
const AVATAR_MAP: Partial<Record<InvestorTypeCode, string>> = {
  BUFFETT: "/diagnosis/buffett.webp",
  LYNCH: "/diagnosis/lynch.webp",
  SOROS: "/diagnosis/soros.webp",
  GRAHAM: "/diagnosis/graham.webp",
  ONEILL: "/diagnosis/oneill.webp",
  TEMPLETON: "/diagnosis/templeton.webp",
  BOGLE: "/diagnosis/bogle.webp",
  DALIO: "/diagnosis/dalio.webp",
};

// サイズバリアントの定義
const SIZE_MAP = {
  sm: {
    size: 64,
    frameClass: "w-16 h-16 min-w-16 min-h-16 rounded-xl",
  },
  md: {
    size: 100,
    frameClass: "w-[100px] h-[100px] rounded-[14px]",
  },
  lg: {
    size: 160,
    frameClass: "w-40 h-40 rounded-2xl",
  },
} as const;

export type AvatarSize = keyof typeof SIZE_MAP;

export interface InvestorAvatarProps {
  typeCode: InvestorTypeCode;
  investorType: string;
  size?: AvatarSize;
}

export function InvestorAvatar({
  typeCode,
  investorType,
  size = "lg",
}: InvestorAvatarProps) {
  const imagePath = AVATAR_MAP[typeCode];
  const hasImage = !!imagePath;
  const { size: pixelSize, frameClass } = SIZE_MAP[size];

  if (!hasImage) {
    // フォールバック: トロフィーアイコン
    return (
      <div
        className={`avatar-frame relative overflow-hidden flex items-center justify-center ${frameClass}`}
      >
        {getResultIcon("trophy")}
      </div>
    );
  }

  return (
    <div className={`avatar-frame relative overflow-hidden ${frameClass}`}>
      <div className="avatar-glow absolute -inset-5 z-0" />
      <Image
        src={imagePath}
        alt={investorType}
        width={pixelSize}
        height={pixelSize}
        className="avatar-image object-cover w-full h-full"
        priority
      />
      <div className="avatar-scanlines absolute inset-0 pointer-events-none z-[2]" />
    </div>
  );
}
