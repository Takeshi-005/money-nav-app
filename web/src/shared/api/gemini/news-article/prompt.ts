import type { NewsArticle } from "@/shared/api/news-api";
import type { DemandKeyword } from "@/shared/api/seo/demand-keywords";
import type { MarketSnapshot } from "./market-snapshot";

export const NEWS_ARTICLE_PROMPT_VERSION = "news-article-v1.7"

export interface GlossarySlugEntry {
  term: string;
  slug: string;
}

function buildMarketDataSection(marketSnapshot?: MarketSnapshot | null): string {
  if (!marketSnapshot) {
    return `\n## 本日の市場データ

本日の日経平均の確定値は取得できていません。
- **日経平均・TOPIX の具体的な指数値（「〇〇円」「〇〇ポイント」などの絶対値）を断定して記載してはならない**（値を創作しない）
- 代わりに、変化の方向（上昇/下落）・変化率（%）・為替（円）・金利（%）など、ニュースから裏付けが取れる数値で説明すること
`;
  }

  const close = marketSnapshot.nikkeiClose.toLocaleString("en-US");
  const sign = marketSnapshot.changeFromPrev >= 0 ? "+" : "";
  const change = `${sign}${marketSnapshot.changeFromPrev.toLocaleString("en-US")}`;
  return `\n## 市場データ（Google検索で確認した確定値・最優先の事実）

- 直近営業日（${marketSnapshot.asOf}）の日経平均終値: ${close}円（前日比 ${change}円）

- 日経平均の具体的な水準に言及する場合は、**必ず上記の確定値を使用し、「${marketSnapshot.asOf}の終値」であることが読者に伝わる表現にすること**（記事作成日の終値と誤認させない）
- これ以外の日経平均の絶対値を記載してはならない
- 水準の性格づけ（「過去最高値」「バブル後最高値」「割高」等）は、ニュース一覧に明確な記載がある場合のみ使用可。独自の判断で付け加えない
`;
}

export function buildNewsArticlePrompt(
  newsArticles: NewsArticle[],
  date: string,
  glossaryTerms?: GlossarySlugEntry[],
  judgeFeedback?: string,
  demandKeywords?: DemandKeyword[],
  marketSnapshot?: MarketSnapshot | null,
): string {
  const newsContext = newsArticles
    .filter((a) => a.description != null && a.description.trim().length > 0)
    .slice(0, 10)
    .map((a, i) => {
      const keyFacts = a.content?.slice(0, 200).replace(/\s+/g, " ").trim()
      return `${i + 1}. ${a.title}
   description: ${a.description}
   source: ${a.source?.name || "unknown"}
   publishedAt: ${a.publishedAt || "unknown"}${keyFacts ? `\n   keyFacts: ${keyFacts}` : ""}`
    })
    .join("\n\n");

  const glossarySection =
    glossaryTerms && glossaryTerms.length > 0
      ? `\n## 用語辞典（既存の用語スラッグ）\n以下の用語が用語辞典に登録されています。keyTermsで該当する用語を使う場合はslugフィールドに対応するスラッグを指定してください:\n${glossaryTerms.map((t) => `- ${t.term}: ${t.slug}`).join("\n")}\n`
      : "";

  const demandSection =
    demandKeywords && demandKeywords.length > 0
      ? `\n## 実需要キーワード（Search Console直近4週）

以下は、ユーザーが実際に検索してこのサイトに訪れている／訪れる可能性のあるキーワードです。タイトル選定の最優先入力として使ってください:

${demandKeywords
          .slice(0, 15)
          .map(
            (k, i) =>
              `${i + 1}. 「${k.query}」 表示${k.impressions}回 / 平均順位${k.avgPosition.toFixed(1)}`,
          )
          .join("\n")}

### タイトル生成ルール（重要）
- **title には上記キーワードのうち、本日のテーマと整合するものを1つ以上含めること**
- ニュースのテーマと需要キーワードが噛み合わない場合は、テーマを優先しつつ需要ワードを補助的に含める
- 上記リストが空、または本日のテーマと全く噛み合わない場合は、初心者向け一般キーワード（「投資初心者」「日経平均」「円安」「NISA」など）を含めること
- 「YYYY年MM月DD日の～」のような日付主導の羅列タイトルは **禁止**（検索需要がゼロのため）
`
      : "";

  const marketDataSection = buildMarketDataSection(marketSnapshot);

  const feedbackSection = judgeFeedback
    ? `\n\n# 前回生成の問題点（必ず修正すること）

以下のフィードバックを反映しない場合、その出力は **無効** とし、同じミスを繰り返した場合は最初から再生成すること（部分的な修正で済ませない）。自己修正ループを必ず実行すること。

${judgeFeedback}`
    : "";

  return `あなたは投資教育コンテンツライター兼ファクトチェッカーです。
${date}の投資関連ニュースをもとに、日本の投資初心者向けの解説記事を作成してください。

## 今日のニュース一覧（事実ベース。解釈は含まない）
${newsContext || "データなし"}
${marketDataSection}
${glossarySection}${demandSection}
## 要件

- 対象読者: 投資を始めたばかりの日本人初心者
- 言語: 日本語（専門用語には必ず用語解説を付ける）
- 上記ニュースの中から最も重要なテーマを1つ選び、深掘り解説すること
- 難しい経済用語は噛み砕いて説明すること
- 株式投資初心者が「なるほど」と思える実践的な内容にすること
- 特定銘柄への投資を強く推奨するような内容は避けること

## 出力形式

以下のJSON形式で回答してください。文字数制限を必ず守ること。

- title: 検索されやすいキーワードを含めること（例:「日経平均」「円安」など具体的な用語）。初心者が思わず読みたくなるタイトル（60文字以内）
- summary: 記事全体を要約したリード文（100文字以内）
- theme: 今日の記事テーマ（例: 米国金利、円安、半導体）（20文字以内）
- category: 以下のカテゴリから最も適切なものを1つ選択すること
  「市場動向」「金融政策」「為替」「政治経済」「企業業績」「テクノロジー」「世界経済」
- sections: 2-4個のセクションに分けて解説（各セクションに見出し・本文・専門用語解説を含める）
  - sections の body は400-600文字で、「なぜそうなるのか」の因果関係を丁寧に解説すること
  - body内では論点が変わる箇所で改行（\\n）を入れて段落を分けること（2-4段落が目安）
  - 手順や列挙が必要な場合は「・」を使った箇条書きを活用すること
  - **抽象表現のみの説明は禁止**（例: 「影響を与える」「重要である」「市場が反応した」のような曖昧表現）。各 body には**具体例（数値・銘柄名・固有名詞）を1つ以上含めること**
- keyTerms: 各セクションに登場する専門用語の解説（最大3つ）
  - **slug は用語辞典に存在するもののみ使用可能**。不明な場合は必ず null を設定する（空文字 "" や存在しない slug の創作は禁止）
- investorInsight: 投資家目線でのまとめ・初心者への実践アドバイス（200文字以内）
- relatedTopics: この記事と関連する学習テーマ3つ（各20文字以内）
- actionItems: 初心者が今日からできる具体的なアクションを2-3個（各60文字以内）
  例: 「SBI証券で日経平均連動のインデックスファンドの値動きを確認してみよう」
- xPostBody: X（旧Twitter）投稿用の本文（**140文字以内**、ハッシュタグ・URLは含めない）
  - 投資初心者が思わずクリックしたくなる核心インサイトを1〜2文で伝える
  - **数値または具体的な変化を1つ含めること**（例: 「円安が155円→158円に進行」「米CPI 3.1%発表」）
  - 任意の装飾（行頭の【見出し】、末尾の「👇」など）は文字数が許す範囲で使用してよいが、必須ではない

## 市場影響（marketImpact）の思考手順（必ず従うこと）

**ステップ0（主因候補の評価）**: ニュースから主因候補を全て抽出し、各候補を以下の3軸で評価すること（内部で必ずスコアリングしてから採用候補を選ぶ。スコアリングを省略しないこと）:
- **A. 日経平均への影響度**（1-5、最重要）
- **B. 影響範囲**（1-5、単一銘柄か、市場全体・複数セクターか）
- **C. 再現性・客観性**（1-5、明確な数値・公式発表に裏付けられているか）

A+B+C の合計スコアが最も高い候補から**最大2件**を主因として採用すること。同点の候補が複数ある場合は、より具体的な数値・発表に裏付けられている方を優先する。

1. 主因は「観測された事実イベント」を優先する。**「期待」「思惑」「観測（〇〇観測）」「警戒感」「投資家心理」といった解釈表現は禁止**（例外: 明確な事実イベントが存在しないが相場が動いた場合に限り、「期待の変化」を補助的に1件まで許容。その場合は driver 名に根拠ニュースを明示）

   **NG例**:
   - 「米利上げ期待が高まり株価上昇」
   - 「景気回復への期待」
   - 「投資家心理が改善」

   **OK例**:
   - 「FRBが政策金利を0.25%引き上げ」
   - 「ドル円が1ドル=155円→158円に上昇」
   - 「日銀が金融政策決定会合で緩和維持を決定」
2. ニュースから直接導かれる主因を最大2つまで特定する。漠然とした期待感や将来性など抽象的な表現は主因にしないこと
3. その主因がどの市場要因（為替・金利・需要・政策など）に影響するか整理する
4. それが日本株市場（日経平均・TOPIX）にどう波及するかを因果関係で説明する
5. 主因が特定できない、または明確な因果関係が説明できない場合は direction を "neutral" とし、reason の冒頭に「主因なし: 」を付けて理由を端的に記述すること（無理に方向を決めない）

## 日経平均と TOPIX の扱い

- 日経平均は値がさ株（半導体・ファストリ等）の影響を受けやすい
- TOPIX は市場全体の広がりを反映する
- 両者の差が説明できない場合は、無理に差をつけず同方向・同強度でもよい

## marketImpact 仕様

- marketImpact: このニュースが日本株式市場に与える影響分析
  - nikkeiImpact: 日経平均への影響
    - direction: "positive"（上昇圧力）/ "negative"（下落圧力）/ "neutral"（中立）
    - magnitude: "large"（大きい）/ "medium"（中程度）/ "small"（小さい）
    - summary: 影響の結論を150文字以内で端的に述べる
    - reason: 「なぜこのニュースが日経平均を動かすのか」を因果関係で解説（50〜300文字）。**必ず「%」「円」「ドル」「金利」「円高」「円安」などの数値・専門用語を含めること**。例: 「米国の利上げ→円安→輸出企業の収益増→日経平均上昇」のような連鎖を初心者向けに説明
  - topixImpact: TOPIXへの影響（nikkeiImpactと同形式。日経平均との違いを意識すること）
  - affectedSectors: 影響を受ける業種・セクターを最大4つ（各セクターに name / impact / reason の構造化データを含む。例の name: 自動車、半導体、金融、商社）
  - educationalNote: 200文字以内。「ニュース→市場への影響」という因果関係を、株式投資を始めたばかりの人が「なるほど！」と思える言葉で解説すること

必ず以下の構造のJSONを返すこと（コードフェンス・markdown 記法は使用禁止。生の JSON のみ出力）:

{
  "title": "タイトル（60文字以内）",
  "summary": "リード文（100文字以内）",
  "theme": "テーマ（20文字以内）",
  "category": "カテゴリ名",
  "sections": [
    {
      "heading": "見出し（40文字以内）",
      "body": "最初の段落の本文。\\n次の段落の本文。（400-600文字、論点ごとに\\nで段落分け）",
      "keyTerms": [
        { "term": "専門用語（20文字以内）", "slug": null, "definition": "用語の説明（100文字以内、用語辞典に存在する場合のみ slug を文字列で指定、それ以外は必ず null）" }
      ]
    }
  ],
  "investorInsight": "投資家向けまとめ（200文字以内）",
  "relatedTopics": ["関連テーマ1", "関連テーマ2", "関連テーマ3"],
  "actionItems": ["アクション1", "アクション2", "アクション3"],
  "xPostBody": "初心者向けインサイトを140文字以内で（数値を含む）",
  "marketImpact": {
    "nikkeiImpact": {
      "direction": "positive",
      "magnitude": "medium",
      "summary": "日経平均への影響の要約（150文字以内）",
      "reason": "因果関係の解説（50〜300文字、%や円などの数値・専門用語を必ず含む）"
    },
    "topixImpact": {
      "direction": "positive",
      "magnitude": "small",
      "summary": "TOPIXへの影響の要約（150文字以内）",
      "reason": "因果関係の解説（50〜300文字、%や円などの数値・専門用語を必ず含む）"
    },
    "affectedSectors": [
      { "name": "自動車", "impact": "positive", "reason": "影響理由（15〜100文字）" }
    ],
    "educationalNote": "初心者向け因果関係解説（200文字以内）"
  }
}

## 注意事項

- 投資家インサイトは予測ではなく**可能性ベースで記述すること**（「〜となる」「〜する」のような断定表現は禁止。「〜の可能性がある」「〜に注目したい」など仮定表現に限定）。投資助言と受け取られる断定は避ける
- **コードフェンス・markdown 記法を一切使用しないこと**。生の JSON だけを出力する
- **JSON 以外のテキストは一切出力しないこと**（前置き・後書き・コードフェンス含む）。すべてのフィールドを必須で埋める
- **JSON は構文的に正しい形式で出力すること**（カンマ・クオートの欠落禁止。末尾カンマ・未閉じブラケットを発生させない）
- **改行・特殊文字を含む場合でも、必ず JSON として有効なエスケープを行うこと**（文字列値内の "、\\、改行 などを適切にエスケープ）
- **文字列内で改行を使用する場合は必ず \\n にエスケープすること**（生の改行文字を文字列内に含めない）
- **全角引用符（"、"）は使用せず、必ず半角ダブルクオート（"）を使用すること**
- **出力前チェックリスト（必ず内部で実行）**:
  1. JSON.parse 可能であること
  2. すべての必須キーが存在すること
  3. 全ての文字列内改行が \\n にエスケープされていること
  4. 不正な全角クオート（"、"）が含まれていないこと
  5. 配列の末尾にカンマが残っていないこと
  6. keyTerms.slug が「用語辞典に存在する文字列」または null のいずれかであること（""空文字や創作 slug は禁止）

## 制約の優先順位（上から順に厳守）

複数の制約が衝突した場合は、以下の優先順位の上位を優先すること（下位は多少の妥協を許容）:
1. JSON 形式の正確性（構文・エスケープ・コードフェンスなし）
2. marketImpact の因果連鎖（主因 → 市場要因 → 波及、数値含有）
3. judgeFeedback の修正指示（前回生成の問題点が与えられている場合）
4. sections の内容深さ・専門用語解説の必須性
5. 文字数制限（軽微な超過は許容）

「壊れた JSON」を出すよりは「文字数を多少超える」方が望ましい。${feedbackSection}`;
}
