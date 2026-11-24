/**
 * クイズプロンプトの構築（動的生成版・難易度対応）
 */
import type { QuizType } from "./schema"
import type { DifficultyLevel } from "@/types/supabase"
import { BRAND } from "@/shared/config"

export const QUIZ_PROMPT_VERSION = "quiz-v2.0"

export interface QuizSeed {
  category: QuizType
  subTheme: string | null
}

export interface RecentQuizSummary {
  title: string
  question: string
  mainConcept: string
  subTheme?: string
  quizType?: string
}

export interface PromptContext {
  selectedSeeds: QuizSeed[]
  marketContext: string
  persona: string
  recentQuizzes: RecentQuizSummary[]
  difficulty: DifficultyLevel
  judgeFeedback?: string
}

export function buildDynamicQuizPrompt(context: PromptContext): string {
  const { selectedSeeds, marketContext, persona, recentQuizzes, difficulty, judgeFeedback } = context

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const categoryInstructions = selectedSeeds
    .map((seed, index) => buildCategoryInstruction(seed, index + 1, today))
    .join("\n\n")

  const avoidDuplicatesSection = buildAvoidDuplicatesSection(recentQuizzes)

  const difficultySection = buildDifficultyInstruction(difficulty)

  const feedbackSection = judgeFeedback
    ? `\n\n# 前回生成の問題点（必ず修正すること）\n${judgeFeedback}`
    : ""

  return `あなたは「${BRAND.NAME}」のコンテンツ生成エンジンです。

# 背景設定
- 日付: ${today}
- 市場状況: ${marketContext}
- 想定読者: ${persona}

# ミッション
${getDifficultyMission(difficulty)}

${categoryInstructions}

# 出力要件
各クイズについて以下を生成:
1. quiz_type: 該当するカテゴリ（"news", "scenario", "psychology", "history", "basic"）
2. title: クイズのタイトル（20文字以内、簡潔かつ興味を引く表現）
3. question: 問題文（100文字程度、読者に考えさせる問いかけ）
4. options: 3つの選択肢（id: 1, 2, 3）
5. correct_option_id: 正解の選択肢ID
6. explanation: なぜその選択肢が正解なのか解説（150文字程度、学びのポイントを明確に）

${difficultySection}

# 多様性の確保
- 3問それぞれが投資学習の異なる側面（市場知識・心理・歴史・実践判断）をカバーすること
- 正解の選択肢IDは1・2・3に均等に分散させること（例: 3問で正解が全て2にならないよう注意）
- 問いかけのパターンを多様化すること（「最も適切なのは」「最も誤りなのは」「正しいのは」「該当しないのは」など）
- 同じ問い方のパターンを3問で繰り返さないこと

# エンゲージメントの工夫
- 問題文は「あなたなら？」という当事者目線で書くこと
  （例: 「あなたは30万円の含み損を抱えています。このとき...」）
- 解説文には「意外な事実」「反直感的なポイント」を1つ含めること
  （例: 「実は多くの投資家がこの判断を間違えます。その理由は...」）
- タイトルは数字・具体的状況・疑問形を使って興味を引くこと
  （例: 「含み損-30%でどうする？」「なぜ損切りが遅れるのか」）

# 制約
- 特定の銘柄の売買を強く推奨するのではなく、あくまで「考え方」を問う内容にすること
- 専門用語には文脈から理解できるようにすること
- タイトルは魅力的で、かつ内容を的確に表現すること
${avoidDuplicatesSection}${feedbackSection}`
}

function buildAvoidDuplicatesSection(recentQuizzes: RecentQuizSummary[]): string {
  if (recentQuizzes.length === 0) { return "" }

  const usedSubThemes = recentQuizzes
    .map((q) => q.subTheme)
    .filter((s): s is string => Boolean(s))

  const subThemesSection =
    usedSubThemes.length > 0
      ? `
## 使用済みサブテーマ（過去7日）
以下のサブテーマは最近使用済みです。同じサブテーマの場合は必ず異なる切り口・難易度感・事例を用いてください:
${usedSubThemes.map((t) => `- ${t}`).join("\n")}`
      : ""

  return `
# 重複回避
${subThemesSection}

## 使用済みクイズ内容
以下の内容は過去7日以内に使用されているため、同じまたは酷似したタイトル・問題内容・主要概念は避けてください:
${recentQuizzes.map((q) => `- タイトル: ${q.title}\n  問題: ${q.question}\n  主要概念: ${q.mainConcept}`).join("\n")}

**重要**: タイトルが異なっていても、扱っている主要概念や問題の切り口が似ている場合は重複とみなしてください。
`
}

function getDifficultyMission(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case "beginner":
      return "投資初心者が楽しみながら、かつ論理的に市場を読み解く力を養えるよう、本日の3つの異なるタイプのクイズを生成してください。"
    case "intermediate":
      return "投資中級者が財務諸表やテクニカル分析を実践的に学べるよう、本日の3つの異なるタイプのクイズを生成してください。"
    case "advanced":
      return "投資上級者が高度なテクニカル分析やマクロ経済分析を深く理解できるよう、本日の3つの異なるタイプのクイズを生成してください。"
  }
}

function buildDifficultyInstruction(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case "beginner":
      return `# 難易度
投資初心者向け（NISA口座開設を検討しているレベル）で、基本的な概念から学べる問題にしてください。`

    case "intermediate":
      return `# 難易度
投資中級者向け（NISA運用開始1-2年、基本用語は理解済み）で、以下のレベル感で出題してください。

## 中級者の前提知識
- PER、PBR、ROE、配当利回りの意味は理解済み
- NISA/iDeCoの基本制度は知っている
- ドルコスト平均法、インデックス投資の概念を理解

## 中級者向けの出題内容
- 財務諸表の読み方（キャッシュフロー計算書、貸借対照表）
- 財務指標の実践的な使い方（ROE vs ROA、自己資本比率）
- 基本的なテクニカル分析（移動平均線、RSI、MACDの基礎）
- セクター分析（景気循環と相性の良いセクター）
- マーケット指標（VIX指数、イールドカーブ）

## 出題の工夫
- 「PERとは？」ではなく「PER 80倍の銘柄、買うべきか？」
- 計算問題よりも「判断問題」を重視
- 専門用語は使用するが、文脈から理解できる程度の配慮`

    case "advanced":
      return `# 難易度
投資上級者向け（投資歴3年以上、個別株運用経験あり）で、以下のレベル感で出題してください。

## 上級者の前提知識
- 財務三表の読解は問題なし
- テクニカル分析の基本指標は使用経験あり
- マクロ経済指標（GDP、CPI、政策金利）の影響を理解

## 上級者向けの出題内容
- 高度なテクニカル分析（ボリンジャーバンド、一目均衡表、フィボナッチ）
- マクロ経済分析（金融政策の市場影響、為替と株価の関連）
- 企業価値評価（DCF法、PEGレシオ、EV/EBITDA）
- リスク管理（ポートフォリオ理論、VaR、シャープレシオ）
- 国際市場分析（米国債利回り、地政学リスク、セクターローテーション）

## 出題の工夫
- 複合的な判断を要する問題（複数要因を総合判断）
- 「なぜそうなるか」のメカニズムを問う
- 実際の市場データを仮定したケーススタディ形式
- 専門用語は説明なしで使用可能`
  }
}

function buildCategoryInstruction(
  seed: QuizSeed,
  num: number,
  today: string
): string {
  const { category, subTheme } = seed

  switch (category) {
    case "news":
      return `## 第${num}問: news（時事ニュース）
**必ずGoogle検索を実行**して、本日の実際のニュース（「${today} 日本 経済ニュース」「株式市場」など）を取得してください。
- 実在するニュースをベースにする
- 「このニュースが起きた時、市場はどう反応するか？」という予測・影響を問う
- 例: 「日銀が金利据え置きを決定。これは円相場にどう影響する？」`

    case "scenario":
      return `## 第${num}問: scenario（シナリオ思考）
サブテーマ: **${subTheme}**
- 具体的なシチュエーションを提示
- 投資家としての「行動マナー」や「メンタル管理」を問う
- 同サブテーマが過去に使われた場合は角度を変えること（例: 前回が「正しい行動は？」なら今回は「避けるべき行動は？」）
- 例: 「保有株が決算後に15%急落。このときの投資判断として最も適切なのは？」`

    case "psychology":
      return `## 第${num}問: psychology（行動経済学）
サブテーマ: **${subTheme}**
- 投資判断における心理バイアスや行動経済学の概念を学ぶ
- 「なぜ多くの人がこの誤りを犯すのか？」を理解させる
- 同サブテーマが過去に使われた場合は角度を変えること（例: 前回が「定義」なら今回は「実際の事例」や「対処法」）
- 例: 「損失回避バイアスとは？株価が下がった時の典型的な失敗例は？」`

    case "history":
      return `## 第${num}問: history（過去の市場イベント）
サブテーマ: **${subTheme}**
- 過去の重要な市場イベントから学ぶ
- 「歴史は繰り返す」という視点で、今後の投資判断に活かせる教訓を問う
- 同サブテーマが過去に使われた場合は角度を変えること（例: 前回が「概要」なら今回は「セクター別影響」や「政策対応」）
- 例: 「リーマンショック時、最も早く回復したセクターは？その理由は？」`

    case "basic":
      return `## 第${num}問: basic（基本知識）
サブテーマ: **${subTheme}**
- 投資用語の定義や計算を問う
- 初心者が必ず知っておくべき基礎概念
- 同サブテーマが過去に使われた場合は角度を変えること（例: 前回が「定義」なら今回は「計算方法」や「活用場面」）
- 例: 「PER（株価収益率）が高い銘柄の特徴として適切なのは？」`

    default:
      return ""
  }
}
