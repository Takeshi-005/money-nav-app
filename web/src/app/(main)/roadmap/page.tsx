import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "投資ロードマップ",
  description:
    "投資の最初の一歩から継続まで、あなたの現在地と次の一歩がわかる成長ロードマップ。診断・クイズ・予測トレーニングの進捗に応じて、口座開設・最初の1株までを伴走します。",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * 投資家成長ロードマップページ
 * FSD構造に基づき、views層からre-export
 */
export { RoadmapPage as default } from "@/views/roadmap";
