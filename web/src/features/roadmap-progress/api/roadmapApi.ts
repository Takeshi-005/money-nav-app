import { client } from "@/shared/api";
import type { RoadmapFlags } from "../lib/flagsStorage";

/** ログインユーザーの自己申告フラグを取得 */
export function fetchRoadmapFlags(): Promise<RoadmapFlags> {
  return client<RoadmapFlags>("/api/roadmap");
}

/** 指定ステップを自己申告（DBに記録） */
export function reportRoadmapStep(
  type: "account" | "firstPurchase",
): Promise<RoadmapFlags> {
  return client<RoadmapFlags>("/api/roadmap", {
    method: "POST",
    body: { type },
  });
}
