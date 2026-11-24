import Image from "next/image";
import Link from "next/link";
import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";
import { INVESTOR_TYPES } from "../lib";

export function InvestorGuidesListPage() {
  return (
    <div className="max-w-4xl mx-auto my-8 px-6 sm:px-8 py-8 bg-surface-secondary rounded-2xl shadow-sm">
      <div className="mb-8">
        <Typography variant="title_L" className="mb-3">
          投資家タイプ別ガイド
        </Typography>
        <Typography variant="M" className="text-(--text-secondary)">
          8つの投資家タイプそれぞれに最適な学習ガイドを用意しました。
          あなたのタイプがわからない場合は、まず
          <Link href="/diagnosis" className="text-brand-500 hover:underline">
            AI投資スタイル診断
          </Link>
          を受けてみましょう。
        </Typography>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {INVESTOR_TYPES.map((type) => (
          <div
            key={type.code}
            className={cn(
              "flex items-start gap-4 p-5 rounded-2xl",
              "bg-surface-secondary border border-(--border-primary)",
            )}
          >
            <Image
              src={`/diagnosis/${type.code.toLowerCase()}.webp`}
              alt={type.name}
              width={64}
              height={64}
              className="rounded-xl shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Typography variant="M_bold">{type.name}</Typography>
                <Typography
                  as="span"
                  variant="caution"
                  className={cn(
                    "font-medium px-2 py-0.5 rounded-full",
                    type.color,
                  )}
                >
                  {type.subtitle}
                </Typography>
              </div>
              <Typography
                variant="S"
                className="text-(--text-secondary) line-clamp-2"
              >
                {type.description}
              </Typography>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
