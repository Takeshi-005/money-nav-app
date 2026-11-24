import type { InvestorTypeCode } from "@/types/supabase";

export interface InvestorTypeStaticData {
  code: InvestorTypeCode;
  name: string;
  subtitle: string;
  description: string;
  keyTraits: [string, string, string];
  bestFor: string;
}

export const INVESTOR_TYPE_DATA: Record<InvestorTypeCode, InvestorTypeStaticData> = {
  BUFFETT: {
    code: "BUFFETT",
    name: "バフェット型",
    subtitle: "価値の賢者",
    description:
      "割安な優良企業を見つけて長期保有するスタイル。短期の値動きに惑わされず、企業の本質的な価値を重視します。じっくり時間をかけて資産を育てたい人に向いています。",
    keyTraits: ["長期保有・じっくり待てる", "企業の本質的な価値を重視", "安全余裕度を確認してから買う"],
    bestFor: "コツコツ長期で資産を増やしたい初心者",
  },
  LYNCH: {
    code: "LYNCH",
    name: "リンチ型",
    subtitle: "成長の探求者",
    description:
      "日常生活で気づいた「ヒット商品」や「伸びている会社」から成長株を発掘するスタイル。難しい分析よりも身近な視点を武器にします。アンテナを張り巡らせるのが好きな人に向いています。",
    keyTraits: ["日常からの気づきを投資に活かす", "中小型の成長株を早期発見", "企業の成長ストーリーを重視"],
    bestFor: "日常の観察眼を活かして投資したい人",
  },
  SOROS: {
    code: "SOROS",
    name: "ソロス型",
    subtitle: "リスクの巨人",
    description:
      "マクロ経済の大きな流れを読んで果敢にリスクを取るスタイル。「市場は間違える」という信念のもと、大胆な逆張りや集中投資を行います。リスク管理を徹底できる上級者向けです。",
    keyTraits: ["マクロ経済・政策の動向を重視", "確信したときに大きくポジションを取る", "相場の誤りを先読みする逆張り"],
    bestFor: "経済ニュースを深く読み込むのが好きな人",
  },
  GRAHAM: {
    code: "GRAHAM",
    name: "グレアム型",
    subtitle: "安全域の守護者",
    description:
      "財務諸表を徹底分析し、株価が本来の価値より大幅に割安な銘柄だけに投資するスタイル。数字に基づいた厳格な基準で「守り」を固めます。堅実な判断が得意な人に向いています。",
    keyTraits: ["PBR・PER など定量指標で判断", "安全余裕度（割安度）を必ず確認", "財務が健全な企業を優先"],
    bestFor: "数字や分析が好きで安全を重視する人",
  },
  ONEILL: {
    code: "ONEILL",
    name: "オニール型",
    subtitle: "モメンタムの追求者",
    description:
      "急成長中の企業のモメンタム（勢い）を捉えて乗るスタイル。損切りを素早く行い、伸びている銘柄に集中投資します。トレンドを見極める力と損切りの規律が重要です。",
    keyTraits: ["上昇トレンドの銘柄に集中投資", "損切りラインを決めて規律を守る", "売上・利益の急成長を確認"],
    bestFor: "チャートを見るのが好きでアクティブに動きたい人",
  },
  TEMPLETON: {
    code: "TEMPLETON",
    name: "テンプルトン型",
    subtitle: "グローバルバリューの開拓者",
    description:
      "世界中から割安株を探し、悲観ムードが漂う市場で買うスタイル。「最大の悲観論が最高の買い場」という逆張り哲学を持ちます。グローバルな視野を持てる人に向いています。",
    keyTraits: ["世界各国の市場を幅広く比較", "市場全体が悲観的なときに買う", "長期の国際分散投資"],
    bestFor: "海外にも興味があり、広い視野で投資したい人",
  },
  BOGLE: {
    code: "BOGLE",
    name: "ボーグル型",
    subtitle: "低コストの賢者",
    description:
      "難しい銘柄選択をせず、低コストのインデックスファンドで市場全体に投資するスタイル。シンプルで継続しやすく、長期で複利の恩恵を最大化します。投資初心者に最もおすすめです。",
    keyTraits: ["インデックスファンドで市場全体に投資", "コスト（信託報酬）を徹底的に下げる", "定期積立で長期間継続する"],
    bestFor: "シンプルに着実な資産形成をしたい初心者",
  },
  DALIO: {
    code: "DALIO",
    name: "ダリオ型",
    subtitle: "全天候の設計者",
    description:
      "株・債券・金・コモディティなど複数の資産に分散して、どんな相場でも安定するポートフォリオを設計するスタイル。リスク管理を最重視し、システマティックに運用します。",
    keyTraits: ["複数の資産クラスに分散投資", "リスクの均等配分（リスクパリティ）", "マクロ経済サイクルを考慮した設計"],
    bestFor: "安定重視で着実にポートフォリオを育てたい人",
  },
};

export const INVESTOR_TYPE_CODES = Object.keys(INVESTOR_TYPE_DATA) as InvestorTypeCode[];
