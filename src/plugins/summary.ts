import { logger } from "../utils/logger.js";

export interface SummaryOptions {
	prNumber: number;
	repositoryOwner: string;
	repositoryName: string;
}

export class SummaryPlugin {
	async generateSummary(options: SummaryOptions): Promise<string> {
		logger.info("Generating PR summary", options);
		return "Summary generated successfully";
	}
}
