import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, DeveloperResponse, ReviewResponse } from "../types.js";
import { DEVELOPER_PROMPT, REVIEWER_PROMPT, parseJSON } from "./shared.js";

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
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return parseJSON<DeveloperResponse>(text, "Gemini developer");
  }

  async reviewCode(
    prTitle: string,
    prBody: string,
    diff: string
  ): Promise<ReviewResponse> {
    const model = this.client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = REVIEWER_PROMPT(prTitle, prBody, diff);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return parseJSON<ReviewResponse>(text, "Gemini reviewer");
  }
}
