import Link from "next/link";
import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";

interface ContentCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
  date?: string;
  accentColor: "brand" | "accent" | "positive";
}

function ContentCard({
  icon,
  title,
  description,
  href,
  date,
  accentColor,
}: ContentCardProps) {
  const colorMap = {
    brand: {
      iconBg: "bg-brand-50",
      iconText: "text-brand-600",
      hoverBorder: "hover:border-brand-200",
    },
    accent: {
      iconBg: "bg-accent-50",
      iconText: "text-accent-600",
      hoverBorder: "hover:border-accent-200",
    },
    positive: {
      iconBg: "bg-positive-50",
      iconText: "text-positive-600",
      hoverBorder: "hover:border-positive-200",
    },
  };

  const colors = colorMap[accentColor];

  return (
    <Link
      href={href}
      aria-label={`${title} - ${description}`}
      className={cn(
        "group block p-6 rounded-2xl bg-surface-elevated border border-(--border-primary) transition-all duration-200",
        "hover:shadow-md hover:scale-[1.01]",
        colors.hoverBorder,
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg",
            colors.iconBg,
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <Typography
            variant="M_bold"
            className="mb-1 group-hover:text-brand-600 transition-colors"
          >
            {title}
          </Typography>
          <Typography
            variant="S"
            className="text-(--text-secondary) line-clamp-2"
          >
            {description}
          </Typography>
          {date && (
            <Typography
              variant="caution"
              className="text-(--text-tertiary) mt-2"
            >
              {date}
            </Typography>
          )}
        </div>
      </div>
    </Link>
  );
}

export function TodayContentSection() {
  return (
    <section aria-label="今日のコンテンツ" className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1.5 h-6 rounded-full bg-gradient-brand" />
          <Typography variant="title_SS">今日のコンテンツ</Typography>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ContentCard
            icon="📌"
            title="明日の好悪材料"
            description="適時開示からAIが翌営業日の好材料・悪材料を分析します"
            href="/tomorrow-impact"
            accentColor="brand"
          />

          <ContentCard
            icon="🧠"
            title="今日のクイズに挑戦"
            description="AIが作成した1問のクイズで投資判断力を鍛えよう"
            href="/quiz"
            date="毎朝 7:00 更新"
            accentColor="accent"
          />
        </div>
      </div>
    </section>
  );
}
