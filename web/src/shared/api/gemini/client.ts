import "server-only";
import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT_ID!,
  location: process.env.GOOGLE_CLOUD_LOCATION ?? "asia-northeast1",
});

export const GEMINI_MODEL = "gemini-2.5-flash";
