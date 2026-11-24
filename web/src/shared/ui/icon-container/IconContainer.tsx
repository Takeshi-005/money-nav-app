import React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

export const iconContainerVariants = cva(
  "flex items-center justify-center shrink-0",
  {
    variants: {
      size: {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
        xl: "w-14 h-14",
        "2xl": "w-16 h-16",
      },
      rounded: {
        sm: "rounded-lg",
        md: "rounded-xl",
        lg: "rounded-2xl",
      },
      bgColor: {
        brand: "bg-brand-100",
        accent: "bg-accent-100",
        positive: "bg-positive-100",
        negative: "bg-negative-100",
        surface: "bg-surface-tertiary",
        "gradient-brand": "bg-gradient-brand",
        "gradient-accent": "bg-gradient-accent",
        "white-semi": "bg-white/20",
        transparent: "bg-transparent",
      },
    },
    defaultVariants: {
      size: "md",
      rounded: "md",
      bgColor: "surface",
    },
  },
);

interface IconContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconContainerVariants> {
  children: React.ReactNode;
  className?: string;
}

export function IconContainer({
  size,
  rounded,
  bgColor,
  className,
  children,
  ...props
}: IconContainerProps) {
  return (
    <div
      className={cn(iconContainerVariants({ size, rounded, bgColor }), className)}
      {...props}
    >
      {children}
    </div>
  );
}
