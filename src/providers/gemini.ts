import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, DeveloperResponse, ReviewResponse } from "../types.js";
import { DEVELOPER_PROMPT, REVIEWER_PROMPT, parseJSON } from "./shared.js";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 15_000; // 15 seconds

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.status || err?.httpStatusCode;
      const isRetryable = status === 429 || status === 503;

      if (isRetryable && attempt < MAX_RETRIES) {
        console.log(
          `   ⚠️ ${label}: ${status} error (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY_MS / 1000}s...`
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

export class GeminiProvider implements AIProvider {
  name = "Gemini";
  private client: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is required");
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateCode(
    issueTitle: string,
    issueBody: string,
    existingFiles: string[]
  ): Promise<DeveloperResponse> {
    const model = this.client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = DEVELOPER_PROMPT(issueTitle, issueBody, existingFiles);

    return withRetry(async () => {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return parseJSON<DeveloperResponse>(text, "Gemini developer");
    }, "Gemini generateCode");
  }

  async reviewCode(
    prTitle: string,
    prBody: string,
    diff: string
  ): Promise<ReviewResponse> {
    const model = this.client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = REVIEWER_PROMPT(prTitle, prBody, diff);

    return withRetry(async () => {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return parseJSON<ReviewResponse>(text, "Gemini reviewer");
    }, "Gemini reviewCode");
  }
}
