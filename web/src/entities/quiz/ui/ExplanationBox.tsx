/**
 * Quiz Entity - ExplanationBox
 * クイズ解説ボックスコンポーネント
 */

import { Typography } from "@/shared/ui/typography";

export interface ExplanationBoxProps {
  explanation: string;
}

export function ExplanationBox({ explanation }: ExplanationBoxProps) {
  return (
    <div className="p-3 rounded-xl bg-brand-50 border border-brand-200">
      <div className="text-xs font-medium mb-1 text-brand-600">解説</div>
      <Typography variant="S" className="text-brand-950">
        {explanation}
      </Typography>
    </div>
  );
}
