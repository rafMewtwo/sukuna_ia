import { getAIProvider } from "./ai-provider.js";
import {
  getIssue,
  listRepoFiles,
  createBranch,
  commitFile,
  createPullRequest,
  commentOnIssue,
  triggerReview,
} from "./github.js";

async function main() {
  const issueNumber = parseInt(process.env.ISSUE_NUMBER || "0");
  if (!issueNumber) {
    throw new Error("ISSUE_NUMBER environment variable is required");
  }

  const ai = getAIProvider();

  console.log(`🔍 Reading issue #${issueNumber}...`);
  const issue = await getIssue(issueNumber);
  console.log(`📋 Issue: ${issue.title}`);

  console.log("📂 Listing existing repo files...");
  const existingFiles = await listRepoFiles();
  console.log(`   Found ${existingFiles.length} files`);

  console.log(`🤖 Asking ${ai.name} to generate code...`);
  const response = await ai.generateCode(issue.title, issue.body, existingFiles);
  console.log(`   ${ai.name} wants to change ${response.files.length} file(s)`);

  if (response.files.length === 0) {
    console.log("⚠️ AI returned no files. Nothing to do.");
    await commentOnIssue(
      issueNumber,
      `🤖 I analyzed this issue using **${ai.name}** but couldn't determine what code changes to make. Please provide more details.`
    );
    return;
  }

  const branchName = `ai/issue-${issueNumber}`;
  console.log(`🌿 Creating branch: ${branchName}`);
  await createBranch(branchName);

  console.log("📝 Committing files...");
  for (const file of response.files) {
    if (file.action === "delete") {
      console.log(`   ❌ Skipping delete (not supported yet): ${file.path}`);
      continue;
    }
    console.log(`   ✏️ ${file.action}: ${file.path}`);
    await commitFile(branchName, file.path, file.content, response.commitMessage);
  }

  console.log("🔀 Creating pull request...");
  const prNumber = await createPullRequest(
    branchName,
    response.prTitle,
    response.prBody,
    issueNumber
  );
  console.log(`✅ PR #${prNumber} created!`);

  await commentOnIssue(
    issueNumber,
    `🤖 I've created PR #${prNumber} to address this issue (powered by **${ai.name}**). The AI reviewer will check it shortly.`
  );

  console.log("📡 Triggering AI Reviewer...");
  await triggerReview(prNumber, process.env.AI_PROVIDER || "gemini");

  console.log("🎉 Done! AI reviewer has been triggered.");
}

main().catch((err) => {
  console.error("❌ Developer failed:", err);
  process.exit(1);
});
