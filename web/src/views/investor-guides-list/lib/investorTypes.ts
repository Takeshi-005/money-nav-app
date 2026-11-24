export interface InvestorTypeCard {
  code: string;
  name: string;
  subtitle: string;
  description: string;
  color: string;
}

export const INVESTOR_TYPES: InvestorTypeCard[] = [
  {
    code: "BUFFETT",
    name: "バフェット型",
    subtitle: "価値の賢者",
    description: "企業の本質的価値を見極め、割安な優良株に長期投資するスタイル",
    color: "bg-brand-100 text-brand-700",
  },
  {
    code: "LYNCH",
    name: "リンチ型",
    subtitle: "成長の探求者",
    description:
      "日常生活の中から成長企業を発見し、中長期で大きなリターンを狙う",
    color: "bg-accent-100 text-accent-700",
  },
  {
    code: "SOROS",
    name: "ソロス型",
    subtitle: "相場の読み師",
    description: "マクロ経済の歪みを見抜き、大胆なポジションで利益を追求する",
    color: "bg-negative-100 text-negative-700",
  },
  {
    code: "GRAHAM",
    name: "グレアム型",
    subtitle: "堅実な分析家",
    description: "財務データを徹底分析し、安全余裕度の高い銘柄に投資する",
    color: "bg-positive-100 text-positive-700",
  },
  {
    code: "ONEILL",
    name: "オニール型",
    subtitle: "モメンタム追従者",
    description: "業績成長と株価の勢いを重視し、トレンドに乗る投資スタイル",
    color: "bg-accent-100 text-accent-700",
  },
  {
    code: "TEMPLETON",
    name: "テンプルトン型",
    subtitle: "逆張りの勇者",
    description: "市場が悲観的な時に勇気を持って買い向かう、逆張り投資の達人",
    color: "bg-brand-100 text-brand-700",
  },
  {
    code: "BOGLE",
    name: "ボーグル型",
    subtitle: "インデックス信者",
    description: "低コストのインデックス投資で市場平均を着実に積み上げる堅実派",
    color: "bg-positive-100 text-positive-700",
  },
  {
    code: "DALIO",
    name: "ダリオ型",
    subtitle: "全天候型戦略家",
    description: "分散投資とリスク管理を極め、あらゆる相場環境に備えるスタイル",
    color: "bg-negative-100 text-negative-700",
  },
];
