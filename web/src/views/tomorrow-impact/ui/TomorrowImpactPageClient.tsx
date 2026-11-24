"use client";

import { useState } from "react";
import { DisclosureImpactCard } from "@/widgets/disclosure-impact-card";
import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";
import { formatMonthDayJP } from "@/shared/lib/date";

interface Props {
  availableDates: string[];
  latestDate: string;
}

export function TomorrowImpactPageClient({ availableDates, latestDate }: Props) {
  const [selectedDate, setSelectedDate] = useState(latestDate);

  return (
    <div className="space-y-6">
      {availableDates.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {availableDates.map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                selectedDate === date
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-surface-secondary text-(--text-secondary) hover:bg-surface-tertiary",
              )}
            >
              {formatMonthDayJP(date)}
            </button>
          ))}
        </div>
      )}

      <Typography variant="S" className="text-(--text-secondary)">
        {formatMonthDayJP(selectedDate)} 発表の適時開示
      </Typography>

      <DisclosureImpactCard date={selectedDate} />
    </div>
  );
}
