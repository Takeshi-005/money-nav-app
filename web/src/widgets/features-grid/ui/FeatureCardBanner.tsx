import { Typography } from "@/shared/ui/typography";
import { ReactNode } from "react";

interface FeatureCardBannerProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function FeatureCardBanner({
  icon,
  title,
  description,
}: FeatureCardBannerProps) {
  return (
    <div className="lg:col-span-2 p-6 md:p-8 rounded-3xl transition-all duration-300 hover:scale-[1.01] bg-gradient-accent-subtle border border-accent-200 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-accent-500">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2 text-accent-900 tracking-tight">
            {title}
          </h3>
          <Typography variant="M_bold">{description}</Typography>
        </div>
      </div>
    </div>
  );
}
