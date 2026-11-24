import {
  GLOSSARY_EXPLANATION_GUIDE,
  GLOSSARY_EXAMPLE_GUIDE,
} from "./depth-guide";

export type GlossaryEnrichTarget = {
  term: string;
  reading: string;
  category: string;
  difficulty: string;
  definition: string;
  explanation: string;
};

export function buildGlossaryEnrichPrompt(
  target: GlossaryEnrichTarget,
  availableSlugs: string[],
): string {
  return `あなたは投資初心者向け用語辞典の編集者です。既存の用語ページの中身を、より深く充実した解説に書き直してください。

# 対象用語
用語: ${target.term}
読み: ${target.reading}
カテゴリ: ${target.category}
難易度: ${target.difficulty}
現在の定義: ${target.definition}
現在の解説: ${target.explanation}

# タスク
explanation と example を下記ガイドに従って厚く書き直し、related_terms を2件以上指定してください。
- 用語(term)・slug・定義(definition)の意味は変えない。同じ用語の解説を充実させるだけです。
- related_terms は以下の実在するスラッグからのみ選ぶ（自分自身は除く）: ${availableSlugs.join(", ")}

${GLOSSARY_EXPLANATION_GUIDE}

${GLOSSARY_EXAMPLE_GUIDE}`;
}
