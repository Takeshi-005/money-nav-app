import type { RoadmapStageDefinition } from "./types";

/**
 * 練習ステージの「卒業」判定の閾値（＝口座開設を勧めてよい状態）。
 * 初心者を急かしすぎず、しかし背中は押す——というバランスを決める
 * プロダクト上の調整値。運用しながらここを変える前提。
 */
export const PRACTICE_GRADUATION = {
  /** クイズの連続日数がこの値以上で十分な練習量とみなす */
  minQuizStreakDays: 3,
  /** または、予測の十分なサンプル数 */
  minPredictionSamples: 5,
  /** かつ予測勝率がこの値以上（0〜1） */
  minPredictionWinRate: 0.5,
} as const;

/**
 * 一本道ジャーニーの定義。order 昇順。
 * ④⑤に収益導線(#20)のスロットを持つ。
 */
export const ROADMAP_STAGES: readonly RoadmapStageDefinition[] = [
  {
    id: "interest",
    order: 1,
    label: "投資に興味を持つ",
    anxiety: "投資ってなんだか難しそう・怖い",
    nudge: "まずは3分の診断で、自分に合うスタイルを知ろう",
    celebrate: "投資への第一歩を踏み出しました！",
    hasReferralSlot: false,
  },
  {
    id: "diagnosis",
    order: 2,
    label: "自分のタイプを知る",
    anxiety: "何から始めればいいか分からない",
    nudge: "毎日のクイズと予測トレーニングで、判断力を練習しよう",
    celebrate: "あなたの投資家タイプが分かりました！",
    hasReferralSlot: false,
  },
  {
    id: "practice",
    order: 3,
    label: "判断を練習する",
    anxiety: "自分の判断が合っているか不安",
    nudge: "練習が身についてきたら、いよいよ口座を開いてみよう",
    celebrate: "練習を重ね、判断力がついてきました！",
    hasReferralSlot: false,
  },
  {
    id: "account",
    order: 4,
    label: "証券口座を開く",
    anxiety: "口座開設は面倒そう・どこがいいか分からない",
    nudge: "あなたのタイプに合う証券会社で、口座を開いてみよう",
    celebrate: "口座開設、おめでとうございます！",
    hasReferralSlot: true,
  },
  {
    id: "firstPurchase",
    order: 5,
    label: "初めての1株を買う",
    anxiety: "何を・いくら買えばいいか分からない",
    nudge: "まずは少額で、最初の1株を買ってみよう",
    celebrate: "ついに投資家デビュー！最初の1株を買えました！",
    hasReferralSlot: true,
  },
  {
    id: "continue",
    order: 6,
    label: "続ける・積み立てる",
    anxiety: "下落が怖い・続けられるか不安",
    nudge: "値動きに一喜一憂せず、コツコツ続けよう",
    celebrate: "投資を継続できています！",
    hasReferralSlot: false,
  },
];
