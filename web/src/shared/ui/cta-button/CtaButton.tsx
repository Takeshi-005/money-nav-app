import Link from "next/link";
import { Typography } from "@/shared/ui/typography";
import { ReactNode } from "react";

interface CtaButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  showArrow?: boolean;
  className?: string;
}

export function CtaButton({
  href,
  children,
  variant = "primary",
  showArrow = false,
  className = "",
}: CtaButtonProps) {
  // 1. 共通スタイル: flex, items-center, justify-center で高さを内部で吸収
  // 2. h-[64px] など高さを明示するか、box-sizing を border-box に徹底する
  const baseStyles =
    "group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] min-h-[64px] box-border";

  const variants = {
    // ボーダーがない場合でも、透明なボーダーを引くことで高さを合わせる手法
    primary:
      "bg-gradient-brand text-white shadow-glow-brand hover:brightness-110 border-2 border-transparent",
    secondary:
      "bg-secondary border-2 border-(--border-primary) shadow-sm hover:bg-muted text-foreground",
  };

  return (
    <Link
      href={href}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {/* leading-none でフォント由来の余計な上下余白をカット */}
      <Typography variant="L_bold" className="leading-none select-none">
        {children}
      </Typography>

      {showArrow && (
        <svg
          className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      )}
    </Link>
  );
}
