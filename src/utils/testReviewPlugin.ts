import { logger } from "./logger.js";
import { parseReviewStyle } from "./reviewStyleParser.js";

export async function testReviewPlugin(): Promise<void> {
	try {
		logger.info("Testing review style parser...");

		// Parse review style to verify it works
		const style = await parseReviewStyle(".");

		logger.info("Review style parser test completed", {
			styleLoaded: !!style,
			tone: style.tone,
			preferredPhrasesCount: style.preferredPhrases?.length || 0,
			avoidedPhrasesCount: style.avoidedPhrases?.length || 0,
		});

		logger.info("Review plugin ready for GitHub webhook integration");
	} catch (error) {
		logger.error("Review plugin test failed", {
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
}
