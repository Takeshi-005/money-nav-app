import Link from "next/link";
import { AlertBox } from "@/shared/ui/alert-box";
import { IconContainer } from "@/shared/ui/icon-container";
import { Typography } from "@/shared/ui/typography";

interface AIDisclosureBannerProps {
  variant?: "default" | "compact";
}

export function AIDisclosureBanner({
  variant = "default",
}: AIDisclosureBannerProps) {
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-surface-tertiary border-(--border-primary) text-(--text-tertiary)">
        <span className="text-base">🤖</span>
        <span>AIアシストによるコンテンツ</span>
      </div>
    );
  }

  return (
    <AlertBox variant="neutral" size="default" className="space-y-0">
      <div className="flex items-start gap-3">
        {/* AI Icon */}
        <IconContainer size="md" rounded="sm" bgColor="gradient-brand">
          <span className="text-xl">🤖</span>
        </IconContainer>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Typography variant="S_bold" className="mb-1">
            AIアシストによるコンテンツ
          </Typography>
          <Typography
            variant="caution"
            color="gray"
            className="leading-relaxed"
          >
            本サービスのコンテンツはGoogle Gemini AIを活用して生成されています。
            情報は参考としてご利用ください。投資判断はご自身の責任で行ってください。
            <Link
              href="/disclaimer"
              className="text-brand-500 hover:underline ml-1"
            >
              詳細を確認
            </Link>
          </Typography>
        </div>
      </div>
    </AlertBox>
  );
}
