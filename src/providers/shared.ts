/**
 * Shared prompts and utilities used by all AI providers.
 */

export function DEVELOPER_PROMPT(
  issueTitle: string,
  issueBody: string,
  existingFiles: string[]
): string {
  return `You are a senior software developer. You have been assigned the following GitHub issue to implement.

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
- Do NOT modify files in .github/ or src/ (those are the automation pipeline)
- Return ONLY the JSON object, no markdown fences or extra text`;
}

export function REVIEWER_PROMPT(
  prTitle: string,
  prBody: string,
  diff: string
): string {
  return `You are a senior code reviewer. Review the following pull request.

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
Return ONLY the JSON object, no markdown fences or extra text.`;
}

/**
 * Parse JSON from AI response, handling markdown fences and extra text.
 */
export function parseJSON<T>(text: string, providerName: string): T {
  // First try direct parse
  try {
    return JSON.parse(text) as T;
  } catch {
    // Try to extract JSON from markdown fences or surrounding text
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim()) as T;
    }

    // Try to find a raw JSON object
    const rawMatch = text.match(/\{[\s\S]*\}/);
    if (rawMatch) {
      return JSON.parse(rawMatch[0]) as T;
    }

    throw new Error(`Failed to parse ${providerName} response as JSON:\n${text}`);
  }
}
