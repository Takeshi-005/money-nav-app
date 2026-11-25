import { z } from "zod";
import { ai, GEMINI_MODEL } from "../client";
import { callGeminiWithRetry } from "../retry";
import {
  glossaryTermsResponseSchema,
  glossaryTermSchema,
  glossaryEnrichResponseSchema,
} from "./schema";
import { buildGlossaryPrompt } from "./prompt";
import {
  buildGlossaryEnrichPrompt,
  type GlossaryEnrichTarget,
} from "./enrich-prompt";

export type GeneratedGlossaryTerm = z.infer<typeof glossaryTermSchema>;
export type EnrichedGlossaryContent = z.infer<
  typeof glossaryEnrichResponseSchema
>;

export async function generateGlossaryTerms(
  existingSlugs: string[],
): Promise<GeneratedGlossaryTerm[]> {
  const prompt = buildGlossaryPrompt(existingSlugs);

  const jsonSchema = z.toJSONSchema(glossaryTermsResponseSchema) as Record<string, unknown>;
  delete jsonSchema.$schema;

  const response = await callGeminiWithRetry(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
      },
    }),
  );

  const text = response.text;
  if (!text) {
    throw new Error("Gemini APIからの応答が空です");
  }

  const parsed = glossaryTermsResponseSchema.parse(JSON.parse(text));
  return parsed.terms;
}

export async function enrichGlossaryTerm(
  target: GlossaryEnrichTarget,
  availableSlugs: string[],
): Promise<EnrichedGlossaryContent> {
  const prompt = buildGlossaryEnrichPrompt(target, availableSlugs);

  const jsonSchema = z.toJSONSchema(glossaryEnrichResponseSchema) as Record<string, unknown>;
  delete jsonSchema.$schema;

  const response = await callGeminiWithRetry(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
      },
    }),
  );

  const text = response.text;
  if (!text) {
    throw new Error("Gemini APIからの応答が空です");
  }

  return glossaryEnrichResponseSchema.parse(JSON.parse(text));
}
