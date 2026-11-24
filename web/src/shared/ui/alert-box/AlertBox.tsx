import React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

export const alertBoxVariants = cva("rounded-2xl border space-y-3", {
  variants: {
    variant: {
      info: "bg-blue-500/5 border-blue-500/10",
      success: "bg-green-500/5 border-green-500/10",
      warning: "bg-amber-500/5 border-amber-500/10",
      danger: "bg-red-500/5 border-red-500/10",
      neutral: "bg-surface-tertiary border-(--border-primary)",
    },
    size: {
      compact: "p-3 rounded-lg",
      default: "p-4 rounded-xl",
      large: "p-6 rounded-2xl",
    },
  },
  defaultVariants: {
    variant: "neutral",
    size: "default",
  },
});

interface AlertBoxProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof alertBoxVariants> {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function AlertBox({
  variant,
  size,
  className,
  children,
  as = "div",
  ...props
}: AlertBoxProps) {
  return React.createElement(
    as,
    {
      className: cn(alertBoxVariants({ variant, size }), className),
      ...props,
    },
    children,
  );
}
