import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, DeveloperResponse, ReviewResponse } from "../types.js";
import { DEVELOPER_PROMPT, REVIEWER_PROMPT, parseJSON } from "./shared.js";

export class ClaudeProvider implements AIProvider {
  name = "Claude";
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  async generateCode(
    issueTitle: string,
    issueBody: string,
    existingFiles: string[]
  ): Promise<DeveloperResponse> {
    const prompt = DEVELOPER_PROMPT(issueTitle, issueBody, existingFiles);

    const message = await this.client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return parseJSON<DeveloperResponse>(text, "Claude developer");
  }

  async reviewCode(
    prTitle: string,
    prBody: string,
    diff: string
  ): Promise<ReviewResponse> {
    const prompt = REVIEWER_PROMPT(prTitle, prBody, diff);

    const message = await this.client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return parseJSON<ReviewResponse>(text, "Claude reviewer");
  }
}
