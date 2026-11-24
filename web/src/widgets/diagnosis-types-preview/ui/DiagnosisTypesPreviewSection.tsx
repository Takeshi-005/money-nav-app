/**
 * Diagnosis Types Preview Section Widget
 * 診断タイププレビューセクション
 */

import Link from "next/link";
import { InvestorAvatar } from "@/entities/diagnosis";
import { Typography } from "@/shared/ui/typography";
import { cn } from "@/shared/lib/utils";
import type { InvestorTypeCode } from "@/types/supabase";

const INVESTOR_TYPES: { code: InvestorTypeCode; name: string }[] = [
  { code: "BUFFETT", name: "バフェット型" },
  { code: "LYNCH", name: "リンチ型" },
  { code: "SOROS", name: "ソロス型" },
  { code: "GRAHAM", name: "グレアム型" },
  { code: "ONEILL", name: "オニール型" },
  { code: "TEMPLETON", name: "テンプルトン型" },
  { code: "BOGLE", name: "ボーグル型" },
  { code: "DALIO", name: "ダリオ型" },
];

export function DiagnosisTypesPreviewSection() {
  return (
    <section aria-label="投資家タイプ診断" className="py-14 md:py-20 bg-surface-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <Typography variant="title_S" className="mb-3">
            あなたはどのタイプ？
          </Typography>
          <Typography variant="M" className="text-(--text-secondary)">
            9つの質問であなたの投資家タイプを診断します
          </Typography>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6 justify-items-center max-w-xl mx-auto">
          {INVESTOR_TYPES.map(({ code, name }) => (
            <div key={code} className="flex flex-col items-center gap-3">
              <InvestorAvatar typeCode={code} investorType={name} size="sm" />
              <p className="text-sm font-medium text-foreground text-center">
                {name}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/diagnosis?start=true"
            className={cn(
              "inline-block px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:scale-[1.02]",
              "bg-gradient-brand ",
            )}
          >
            無料で診断を受ける →
          </Link>
        </div>
      </div>
    </section>
  );
}
