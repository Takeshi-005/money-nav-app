import {
  GLOSSARY_EXPLANATION_GUIDE,
  GLOSSARY_EXAMPLE_GUIDE,
} from "./depth-guide";

export function buildGlossaryPrompt(existingSlugs: string[]): string {
  const existingSection =
    existingSlugs.length > 0
      ? `\n# 既存用語（重複禁止）\n以下のスラッグの用語は登録済みです。これらと同じ用語は生成しないでください:\n${existingSlugs.map((s) => `- ${s}`).join("\n")}\n`
      : "";

  return `あなたは投資初心者向けの用語辞典コンテンツ生成エンジンです。

# ミッション
投資初心者が学ぶべき重要な投資用語を5〜10件生成してください。
${existingSection}
# カテゴリ（7種）
- 基本指標: PER、PBR、ROE、配当利回りなど
- チャート分析: ローソク足、移動平均線、RSI、MACDなど
- ファンダメンタルズ: 決算短信、財務諸表、キャッシュフローなど
- 投資手法: ドルコスト平均法、バリュー投資、インデックス投資など
- 市場・制度: NISA、iDeCo、東証プライム、IPO、日経平均（nikkei-average）、TOPIXなど
- リスク管理: 損切り、分散投資、リスクリワード比など
- その他: 上記に当てはまらないもの

# 難易度（3段階）
- beginner: 投資を始めたばかりの人が最初に知るべき用語
- intermediate: 投資1〜2年目で理解すべき用語
- advanced: 本格的に分析を行う投資家向けの用語

# 生成ルール
1. カテゴリと難易度のバランスを意識し、偏りなく生成する
2. slugは英語小文字とハイフンのみ（例: 移動平均線→moving-average、PER→per、損切り→stop-loss、NISA→nisa）
3. definitionは一文で簡潔に（50文字以内）
4. explanationは下記ガイドに従って厚く書く
5. exampleは下記ガイドに従って必ず1つ示す
6. related_termsは関連する用語の英語スラッグで2件以上指定（例: ["per", "pbr", "roe"]）
7. readingはひらがなで記載（英字略語はカタカナ読みをひらがなに変換）

${GLOSSARY_EXPLANATION_GUIDE}

${GLOSSARY_EXAMPLE_GUIDE}`;
}
