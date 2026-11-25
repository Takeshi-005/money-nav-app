import "server-only";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

/**
 * Gemini(Vertex AI)のクライアントを初めて使うときに作る
 *
 * 読み込んだ時点で作ると、GCP_PROJECT_ID などを渡さないビルド(next build)で
 * 「認証が設定されていない」として失敗するため。
 */
function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({
      vertexai: true,
      project: process.env.GCP_PROJECT_ID,
      location: process.env.GOOGLE_CLOUD_LOCATION ?? "asia-northeast1",
    });
  }
  return client;
}

export const ai = {
  get models(): GoogleGenAI["models"] {
    return getClient().models;
  },
};

export const GEMINI_MODEL = "gemini-2.5-flash";
