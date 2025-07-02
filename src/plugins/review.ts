import { logger } from "../utils/logger.js";

export interface ReviewOptions {
	prNumber: number;
	repositoryOwner: string;
	repositoryName: string;
}

export class ReviewPlugin {
	async generateReview(options: ReviewOptions): Promise<string> {
		logger.info("Generating PR review", options);
		return "Review generated successfully";
	}
}
