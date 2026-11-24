import Link from "next/link";
import { Typography } from "@/shared/ui/typography";
import {
  InvestorAvatar,
  INVESTOR_TYPE_DATA,
  INVESTOR_TYPE_CODES,
} from "@/entities/diagnosis";
import { INVESTOR_TYPE_TEASERS } from "../lib/types-teaser";

export function DiagnosisTypesShowcase() {
  return (
    <section
      aria-labelledby="diagnosis-types-heading"
      className="py-12 md:py-16 bg-surface-secondary"
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <Typography
            variant="title_S"
            as="h2"
            id="diagnosis-types-heading"
            className="mb-3"
          >
            8つの投資家タイプ
          </Typography>
          <Typography
            variant="M"
            className="text-(--text-secondary) max-w-xl mx-auto"
          >
            診断では、世界的に著名な投資家の哲学に基づいた8タイプから、あなたに最適な投資スタイルを判定します。
          </Typography>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {INVESTOR_TYPE_CODES.map((code) => {
            const data = INVESTOR_TYPE_DATA[code];
            const teaser = INVESTOR_TYPE_TEASERS[code];
            return (
              <div
                key={code}
                className="p-5 rounded-2xl bg-(--bg-primary) border border-(--border-primary)"
              >
                <div className="flex items-start gap-3 mb-3">
                  <InvestorAvatar
                    typeCode={code}
                    investorType={data.name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <Typography variant="M_bold" as="h3" className="leading-tight">
                      {data.name}
                    </Typography>
                    <Typography
                      variant="caution"
                      className="text-(--text-tertiary) mt-0.5"
                    >
                      {data.subtitle}
                    </Typography>
                  </div>
                </div>
                <Typography
                  variant="S"
                  className="text-(--text-secondary) leading-relaxed"
                >
                  {teaser}
                </Typography>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/investor-guides"
            className="inline-block text-brand-600 hover:text-brand-700 font-medium underline"
          >
            <Typography variant="S" as="span">
              → 8タイプ別の投資哲学・学習ステップを詳しく見る
            </Typography>
          </Link>
        </div>
      </div>
    </section>
  );
}
