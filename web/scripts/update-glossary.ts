import { generateGlossaryTerms } from "../src/shared/api/gemini/glossary/generate";
import {
  findGlossaryTermSlugs,
  upsertGlossaryTerms,
} from "../src/entities/glossary-term/api/glossary-client";

async function main() {
  console.log("用語辞典の更新を開始します...\n");

  const existingSlugsData = await findGlossaryTermSlugs();
  const existingSlugs = existingSlugsData.map((t) => t.slug);
  console.log(`既存用語数: ${existingSlugs.length}件`);

  console.log("Gemini APIで新規用語を生成中...");
  const generatedTerms = await generateGlossaryTerms(existingSlugs);
  console.log(`生成された用語数: ${generatedTerms.length}件\n`);

  for (const term of generatedTerms) {
    console.log(
      `  - ${term.term} (${term.slug}) [${term.category}/${term.difficulty}]`,
    );
  }

  console.log("\nSupabaseに保存中...");
  const result = await upsertGlossaryTerms(generatedTerms);
  console.log(
    `\n完了: 新規追加 ${result.inserted}件, 更新 ${result.updated}件`,
  );
}

main().catch((error) => {
  console.error("用語辞典の更新に失敗しました:", error);
  process.exit(1);
});
