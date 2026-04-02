import { reviewCode } from "./claude.js";
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

  console.log("🤖 Asking Claude to review...");
  const review = await reviewCode(pr.title, pr.body, truncatedDiff);
  console.log(`   Decision: ${review.decision}`);
  console.log(`   Summary: ${review.summary}`);
  console.log(`   Comments: ${review.comments.length}`);

  console.log("📝 Submitting review...");
  await submitReview(
    prNumber,
    review.decision,
    review.summary,
    review.comments
  );
  console.log(`✅ Review submitted: ${review.decision}`);

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
