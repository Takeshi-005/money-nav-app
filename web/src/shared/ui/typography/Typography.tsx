import React from "react";

import { VariantProps, cva } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

// Typography variant definitions (exported for reuse)
export const typographyVariantConfig = {
  // Body variants
  h2: "text-3xl md:text-4xl font-bold",
  L2: "text-2xl font-bold",
  L: "text-lg leading-relaxed", // 18px
  L_bold: "text-lg font-bold leading-relaxed",
  M: "text-base leading-normal", // 16px (基準)
  M_bold: "text-base font-bold leading-normal",
  S: "text-sm leading-normal", // 14px
  S_bold: "text-sm font-bold leading-normal",
  caution: "text-xs leading-tight leading-relaxed", // 12px (例外：パンくず・注釈) li
  price: "text-2xl font-bold leading-tight", // 24px (例外：価格)

  // Title variants
  title_L: "text-[32px] font-bold tracking-tight", // 32px
  title_M: "text-[28px] font-bold tracking-tight", // 28px
  title_S: "text-2xl font-bold tracking-tight", // 24px
  title_SS: "text-xl font-bold tracking-tight", // 20px (例外：SP用)
};

export const typographyVariants = cva("", {
  variants: {
    // ========================================
    // variant: サイズ+太さ（デザイナー定義）
    // ========================================
    variant: typographyVariantConfig,

    // ========================================
    // color: 色指定（エンジニア定義：システム用）
    // ========================================
    color: {
      default: "text-gray-950",
      gray: "text-gray-700",
      white: "text-white/90",
      positive: "text-green-600", // ポジティブ
      error: "text-red-600", // エラー
      success: "text-green-600", // 成功
      warning: "text-destructive", // 警告
      info: "text-[#0096EE]", // 情報（カスタムカラー）
      muted: "text-muted-foreground", // 控えめ（グレー系）
    },
  },
  defaultVariants: {
    variant: "M",
    color: "default",
  },
});

type TypographyVariants = VariantProps<typeof typographyVariants>;

interface TypographyProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "color"
> {
  variant?: TypographyVariants["variant"];
  color?: TypographyVariants["color"];
  as?: keyof React.JSX.IntrinsicElements;
  children?: React.ReactNode;
  className?: string;
}

export function Typography({
  className,
  variant = "M",
  color = "default",
  as,
  children,
  ...props
}: TypographyProps) {
  // asが指定されていない場合、variantに基づいてデフォルトの要素を決定
  const getDefaultElement = (
    variant: TypographyVariants["variant"],
  ): keyof React.JSX.IntrinsicElements => {
    // Title variants
    if (variant === "title_L") {
      return "h1";
    }
    if (variant === "title_M") {
      return "h2";
    }
    if (variant === "title_S") {
      return "h3";
    }
    if (variant === "title_SS") {
      return "h4";
    }

    // Body variants (デフォルトはp)
    return "p";
  };

  const Comp = as ?? getDefaultElement(variant);

  return React.createElement(
    Comp,
    {
      className: cn(typographyVariants({ variant, color }), className),
      ...props,
    },
    children,
  );
}
