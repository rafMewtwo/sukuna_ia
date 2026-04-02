import type { AIProvider } from "./types.js";
import { GeminiProvider } from "./providers/gemini.js";
import { ClaudeProvider } from "./providers/claude.js";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "gemini";

  switch (provider.toLowerCase()) {
    case "gemini":
      console.log("🤖 Using AI Provider: Gemini Flash");
      return new GeminiProvider();
    case "claude":
      console.log("🤖 Using AI Provider: Claude Haiku");
      return new ClaudeProvider();
    default:
      throw new Error(
        `Unknown AI_PROVIDER: "${provider}". Supported: "gemini", "claude"`
      );
  }
}
