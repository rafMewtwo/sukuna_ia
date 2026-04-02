import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface FileChange {
  path: string;
  content: string;
  action: "create" | "modify" | "delete";
}

export interface DeveloperResponse {
  files: FileChange[];
  commitMessage: string;
  prTitle: string;
  prBody: string;
}

export interface ReviewResponse {
  decision: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
  summary: string;
  comments: Array<{
    path: string;
    line: number;
    body: string;
  }>;
}

export async function generateCode(
  issueTitle: string,
  issueBody: string,
  existingFiles: string[]
): Promise<DeveloperResponse> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a senior software developer. You have been assigned the following GitHub issue to implement.

## Issue
**Title:** ${issueTitle}
**Description:** ${issueBody}

## Existing files in the repo
${existingFiles.length > 0 ? existingFiles.join("\n") : "(empty repo)"}

## Instructions
Implement the requested feature/fix. Return your response as a JSON object with this exact structure:

{
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "full file content here",
      "action": "create"
    }
  ],
  "commitMessage": "short commit message describing the change",
  "prTitle": "PR title (concise)",
  "prBody": "PR description explaining what was done and why"
}

Rules:
- Write clean, production-quality TypeScript/JavaScript code
- Include proper error handling
- Do NOT modify files in .github/ or src/developer.ts, src/reviewer.ts, src/claude.ts, src/github.ts
- Return ONLY the JSON object, no markdown fences or extra text`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    return JSON.parse(text) as DeveloperResponse;
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as DeveloperResponse;
    }
    throw new Error(`Failed to parse Claude response as JSON: ${text}`);
  }
}

export async function reviewCode(
  prTitle: string,
  prBody: string,
  diff: string
): Promise<ReviewResponse> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a senior code reviewer. Review the following pull request.

## Pull Request
**Title:** ${prTitle}
**Description:** ${prBody}

## Diff
\`\`\`diff
${diff}
\`\`\`

## Instructions
Review the code changes and return a JSON object with this exact structure:

{
  "decision": "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
  "summary": "Overall review summary",
  "comments": [
    {
      "path": "file/path.ts",
      "line": 10,
      "body": "Comment about this specific line"
    }
  ]
}

Review criteria:
- Code quality and readability
- Potential bugs or edge cases
- Security concerns
- Performance issues
- Whether the code matches the PR description

Be constructive but thorough. Only REQUEST_CHANGES for real issues, not style preferences.
Return ONLY the JSON object, no markdown fences or extra text.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    return JSON.parse(text) as ReviewResponse;
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ReviewResponse;
    }
    throw new Error(`Failed to parse Claude review response: ${text}`);
  }
}
