import { reviewPlugin } from "../plugins/reviewPlugin.js";
import { logger } from "./logger.js";
import { parseReviewStyle } from "./reviewStyleParser.js";

export async function testReviewPlugin(): Promise<void> {
	try {
		logger.info("Testing review plugin...");

		// Parse review style
		const style = await parseReviewStyle(".");

		// Sample diff for testing
		const sampleDiff = `--- a/src/utils/helper.ts
+++ b/src/utils/helper.ts
@@ -1,5 +1,10 @@
 export function calculateTotal(items: number[]): number {
-  return items.reduce((sum, item) => sum + item, 0);
+  // Add input validation
+  if (!Array.isArray(items)) {
+    throw new Error('Items must be an array');
+  }
+  
+  return items.reduce((sum, item) => sum + item, 0);
 }
 
 export function formatCurrency(amount: number): string {
-  return \`$\${amount.toFixed(2)}\`;
+  // Handle negative amounts
+  const formattedAmount = Math.abs(amount).toFixed(2);
+  return amount < 0 ? \`-$\${formattedAmount}\` : \`$\${formattedAmount}\`;
 }`;

		logger.info("Testing with sample diff", {
			diffLines: sampleDiff.split("\n").length,
			styleLoaded: !!style,
		});

		// Generate review comments
		const comments = await reviewPlugin({
			diff: sampleDiff,
			style,
		});

		logger.info("Review plugin test completed", {
			commentsGenerated: comments.length,
		});

		logger.info("Generated review comments:", comments);
	} catch (error) {
		logger.error("Review plugin test failed", {
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
}
