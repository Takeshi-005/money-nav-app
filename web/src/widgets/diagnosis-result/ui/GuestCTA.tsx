"use client";

/**
 * Guest CTA Component
 * ゲストユーザー向けログイン促進
 */
import { useRouter } from "next/navigation";
import { Typography } from "@/shared/ui/typography";

export function GuestCTA() {
  const router = useRouter();

  return (
    <div className="p-6 rounded-3xl text-center mb-6 bg-gradient-brand">
      <h3 className="text-xl font-bold  mb-2">結果を保存しましょう！</h3>
      <Typography variant="S" className="text-white/80 mb-4">
        ログインすると診断結果が保存され、毎日のクイズで経験値を貯めることができます。
      </Typography>
      <button
        onClick={() => router.push("/login?redirect=/dashboard")}
        className="px-6 py-3 rounded-xl font-medium bg-white transition-all duration-200 hover:scale-105 text-brand-600"
      >
        Googleでログイン
      </button>
    </div>
  );
}
