/**
 * Diagnosis Entity - Questions
 * 9ステップの質問定義
 */
import type { Step } from "./constants";
import type { DiagnosisIconKey } from "../ui/DiagnosisIcons";

/** 質問の選択肢 */
export interface QuestionOption {
  value: string;
  label: string;
  iconKey: DiagnosisIconKey;
}

/** 質問 */
export interface Question {
  title: string;
  description: string;
  options: QuestionOption[];
}

/** 全ステップの質問定義 */
export const questions: Record<Step, Question> = {
  1: {
    title: "投資対象地域",
    description: "どの市場に投資したいですか？",
    options: [
      { value: "japan", label: "日本株", iconKey: "japan" },
      { value: "us", label: "米国株", iconKey: "us" },
    ],
  },
  2: {
    title: "投資期間",
    description: "どのくらいの期間で運用を考えていますか？",
    options: [
      { value: "short", label: "短期（1年未満）", iconKey: "short" },
      { value: "medium", label: "中期（1-3年）", iconKey: "medium" },
      { value: "long", label: "長期（3年以上）", iconKey: "long" },
    ],
  },
  3: {
    title: "投資スタイル",
    description: "どのような利益を重視しますか？",
    options: [
      { value: "growth", label: "成長重視（値上がり益）", iconKey: "growth" },
      { value: "dividend", label: "配当重視（配当金）", iconKey: "dividend" },
    ],
  },
  4: {
    title: "リスク許容度",
    description: "どの程度のリスクを取れますか？",
    options: [
      { value: "low", label: "低い（元本重視）", iconKey: "lowRisk" },
      { value: "medium", label: "普通（バランス型）", iconKey: "mediumRisk" },
      { value: "high", label: "高い（リターン重視）", iconKey: "highRisk" },
    ],
  },
  5: {
    title: "月々の投資額",
    description: "毎月いくらくらい投資に回せますか？",
    options: [
      { value: "1", label: "1万円以下", iconKey: "budget1" },
      { value: "3", label: "3〜5万円程度", iconKey: "budget3" },
      { value: "10", label: "10万円以上", iconKey: "budget10" },
    ],
  },
  6: {
    title: "投資目的",
    description: "投資の目的は何ですか？",
    options: [
      { value: "retirement", label: "老後資金", iconKey: "retirement" },
      { value: "income", label: "副収入", iconKey: "income" },
      { value: "hobby", label: "趣味として", iconKey: "hobby" },
      { value: "fire", label: "FIRE達成", iconKey: "fire" },
    ],
  },
  7: {
    title: "下落時の行動",
    description: "保有株が20%下落したらどうしますか？",
    options: [
      { value: "sell", label: "すぐに損切りする", iconKey: "sell" },
      { value: "hold", label: "様子を見る", iconKey: "hold" },
      { value: "buy_more", label: "買い増しを検討する", iconKey: "buyMore" },
    ],
  },
  8: {
    title: "情報収集スタイル",
    description: "投資判断の主な根拠は？",
    options: [
      { value: "news", label: "ニュース・SNS", iconKey: "news" },
      { value: "chart", label: "チャート分析", iconKey: "chart" },
      { value: "financials", label: "決算・財務諸表", iconKey: "financials" },
      { value: "intuition", label: "直感・経験", iconKey: "intuition" },
    ],
  },
  9: {
    title: "市場変動への対応",
    description: "市場が急変したときの行動は？",
    options: [
      { value: "immediate", label: "すぐに対応する", iconKey: "immediate" },
      {
        value: "analyze",
        label: "じっくり分析してから行動",
        iconKey: "analyze",
      },
      { value: "ignore", label: "基本的に動かない", iconKey: "ignore" },
    ],
  },
};
