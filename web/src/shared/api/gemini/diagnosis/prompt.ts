/**
 * 診断プロンプトの構築
 */
import type { DiagnosisInput } from "@/types/supabase"
import { formatSectorsForPrompt } from "./sectors"

export function buildDiagnosisPrompt(input: DiagnosisInput): string {
  const regionLabel = input.region === "japan" ? "日本株" : "米国株";
  const periodLabel =
    input.period === "short"
      ? "短期（1年未満）"
      : input.period === "medium"
        ? "中期（1-3年）"
        : "長期（3年以上）";
  const styleLabel =
    input.style === "growth" ? "成長重視（キャピタルゲイン）" : "配当重視（インカムゲイン）";
  const riskLabel =
    input.riskTolerance === "low"
      ? "低い（元本重視）"
      : input.riskTolerance === "medium"
        ? "普通（バランス型）"
        : "高い（リターン重視）";
  const budgetLabel = `${input.budget}万円程度`;
  const purposeLabels: Record<string, string> = {
    retirement: "老後資金",
    income: "副収入",
    hobby: "趣味として",
    fire: "FIRE達成",
  };

  const lossReactionLabels: Record<string, string> = {
    sell: "すぐに損切りする",
    hold: "様子を見る",
    buy_more: "買い増しを検討する",
  };
  const decisionBasisLabels: Record<string, string> = {
    news: "ニュース・SNS",
    chart: "チャート分析",
    financials: "決算・財務諸表",
    intuition: "直感・経験",
  };
  const volatilityResponseLabels: Record<string, string> = {
    immediate: "すぐに対応する",
    analyze: "じっくり分析してから行動",
    ignore: "基本的に動かない",
  };

  return `あなたは投資スタイル診断の専門家です。以下のユーザー情報を分析し、8つの投資家タイプから最も適合するものを判定してください。

【8つの投資家タイプ定義】

1. BUFFETT: バフェット型（価値の賢者）
   特徴: 企業の本質的価値を見極め、割安な優良株を長期保有
   向いている人: 長期投資・低〜中リスク・財務分析重視・下落時に動じない
   投資格言: 「素晴らしい企業を適正価格で買う」

2. LYNCH: リンチ型（成長の探求者）
   特徴: 日常生活から成長企業を発掘、中長期で大きなリターンを狙う
   向いている人: 成長重視・中長期・ファンダメンタル分析・積極的
   投資格言: 「自分が知っているものに投資せよ」

3. SOROS: ソロス型（相場の読み師）
   特徴: マクロ経済を読み、大胆なポジションで短中期の利益を追求
   向いている人: 高リスク許容・短中期・即座に行動・ニュース重視
   投資格言: 「まず生き残れ、儲けるのはそれからだ」

4. GRAHAM: グレアム型（堅実な分析家）
   特徴: 安全域を重視し、財務健全な割安株を厳選
   向いている人: 超保守的・配当重視・財務分析・市場に左右されない
   投資格言: 「安全域を持て」

5. ONEILL: オニール型（モメンタム追従者）
   特徴: チャートとファンダメンタルを組み合わせ、成長トレンドに乗る
   向いている人: テクニカル分析・成長株・トレンドに敏感
   投資格言: 「市場のリーダー株を買え」

6. TEMPLETON: テンプルトン型（逆張りの勇者）
   特徴: 悲観の極みで買い、楽観の極みで売る逆張り投資
   向いている人: 長期・下落時に買い増し・忍耐強い
   投資格言: 「強気相場は悲観の中で生まれる」

7. BOGLE: ボーグル型（インデックス信者）
   特徴: 低コストの分散投資で市場全体のリターンを享受
   向いている人: 長期・低リスク・手間をかけたくない・配当再投資
   投資格言: 「干し草の中の針を探すな、干し草を買え」

8. DALIO: ダリオ型（全天候型戦略家）
   特徴: 資産クラスを分散し、あらゆる市場環境に対応
   向いている人: バランス重視・分析的・リスク分散
   投資格言: 「分散投資は唯一のフリーランチ」

【ユーザー情報】
- 投資対象地域: ${regionLabel}
- 投資期間: ${periodLabel}
- 投資スタイル: ${styleLabel}
- リスク許容度: ${riskLabel}
- 投資予算: ${budgetLabel}
- 投資目的: ${purposeLabels[input.purpose] || input.purpose}
- 下落時の行動: ${lossReactionLabels[input.lossReaction] || input.lossReaction}
- 情報収集スタイル: ${decisionBasisLabels[input.decisionBasis] || input.decisionBasis}
- 市場変動への対応: ${volatilityResponseLabels[input.volatilityResponse] || input.volatilityResponse}

【出力要件】
上記の8タイプ定義とユーザー情報を照合し、最も適合するタイプを判定してください。
- typeCode: 8タイプのコードから1つ選択（BUFFETT, LYNCH, SOROS, GRAHAM, ONEILL, TEMPLETON, BOGLE, DALIO）
- investorType: 「〇〇型（サブタイトル）」形式のタイプ名
- resultText: このユーザーがなぜそのタイプに該当するか、300文字程度で説明
- famousQuote: そのタイプの代表的な投資格言
- strengths: このタイプの強み（3つ）
- weaknesses: このタイプの注意点・弱み（3つ）
- actionAdvice: このユーザーへの具体的な投資行動アドバイス（100文字程度）
- recommendedSectors: ユーザーに合った投資セクター（以下から3つ選択: ${formatSectorsForPrompt(input.region)}）
- suggestedTickers: 具体的な銘柄（3つまで、${regionLabel}から選択）

【セクター・銘柄選定の注意事項】
- recommendedSectorsは必ず${regionLabel}の市場で取引されているセクターから選択してください
- suggestedTickersは必ず${regionLabel}の市場で実在する銘柄を記載してください
- 日本株の場合は銘柄コードに4桁の数字を使用してください（例: 7203、6758）
- 米国株の場合はティッカーシンボルを使用してください（例: AAPL、MSFT）

注意: 本サービスは投資教育目的であり、具体的な投資判断を推奨するものではありません。`;
}
