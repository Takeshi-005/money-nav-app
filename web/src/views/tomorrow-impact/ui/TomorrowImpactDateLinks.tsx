import Link from "next/link";
import { Typography } from "@/shared/ui/typography";
import { NAVIGATION_BUILDERS } from "@/shared/config";
import { formatMonthDayJP } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";

interface Props {
  dates: string[];
  currentDate?: string;
}

export function TomorrowImpactDateLinks({ dates, currentDate }: Props) {
  if (dates.length === 0) {
    return null;
  }

  return (
    <nav aria-label="過去の好悪材料分析" className="space-y-2">
      <Typography variant="S_bold" as="h2" className="text-(--text-secondary)">
        過去の好悪材料分析
      </Typography>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {dates.map((date) => {
          const isActive = date === currentDate;
          return (
            <Link
              key={date}
              href={NAVIGATION_BUILDERS.tomorrowImpactDetail(date)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-surface-secondary text-(--text-secondary) hover:bg-surface-tertiary",
              )}
            >
              {formatMonthDayJP(date)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
