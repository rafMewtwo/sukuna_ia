import { getAIProvider } from "./ai-provider.js";
import {
  getPullRequest,
  getPullRequestDiff,
  submitReview,
  mergePullRequest,
} from "./github.js";

async function main() {
  const prNumber = parseInt(process.env.PR_NUMBER || "0");
  if (!prNumber) {
    throw new Error("PR_NUMBER environment variable is required");
  }

  const ai = getAIProvider();

  console.log(`🔍 Reading PR #${prNumber}...`);
  const pr = await getPullRequest(prNumber);
  console.log(`📋 PR: ${pr.title}`);

  console.log("📄 Getting diff...");
  const diff = await getPullRequestDiff(prNumber);
  console.log(`   Diff size: ${diff.length} characters`);

  // Truncate diff if too large for API
  const maxDiffSize = 10000;
  const truncatedDiff =
    diff.length > maxDiffSize
      ? diff.substring(0, maxDiffSize) + "\n\n... (diff truncated)"
      : diff;

  console.log(`🤖 Asking ${ai.name} to review...`);
  const review = await ai.reviewCode(pr.title, pr.body, truncatedDiff);
  console.log(`   Decision: ${review.decision}`);
  console.log(`   Summary: ${review.summary}`);
  console.log(`   Comments: ${review.comments.length}`);

  // GitHub doesn't allow GITHUB_TOKEN to APPROVE its own PRs,
  // so we submit APPROVE decisions as COMMENT instead and merge directly.
  const submitEvent = review.decision === "APPROVE" ? "COMMENT" : review.decision;
  const statusEmoji = review.decision === "APPROVE" ? "✅" : review.decision === "REQUEST_CHANGES" ? "❌" : "💬";
  const reviewBody = `${statusEmoji} **[${ai.name} Review — ${review.decision}]**\n\n${review.summary}`;

  console.log("📝 Submitting review...");
  await submitReview(prNumber, submitEvent, reviewBody, review.comments);
  console.log(`✅ Review submitted: ${review.decision} (as ${submitEvent})`);

  if (review.decision === "APPROVE") {
    console.log("🔀 Auto-merging PR...");
    try {
      await mergePullRequest(prNumber);
      console.log("✅ PR merged to main!");
    } catch (err) {
      console.error("⚠️ Auto-merge failed (may need manual merge):", err);
    }
  } else {
    console.log(
      `⏸️ PR not approved (${review.decision}). Waiting for developer to address feedback.`
    );
  }

  console.log("🎉 Review complete!");
}

main().catch((err) => {
  console.error("❌ Reviewer failed:", err);
  process.exit(1);
});
