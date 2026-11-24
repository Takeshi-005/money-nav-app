import { z } from "zod";

export const companyNameSchema = z.object({
  companyName: z
    .string()
    .describe("日本株の正式な日本語銘柄名（例: トヨタ自動車、ソニーグループ）"),
});

export type CompanyNameOutput = z.infer<typeof companyNameSchema>;
