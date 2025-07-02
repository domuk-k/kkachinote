import { logger } from "../utils/logger.js";
import { BaseLLMProvider } from "./base.js";

export class OpenAIProvider extends BaseLLMProvider {
	async generateText(prompt: string): Promise<string> {
		logger.info("Generating text with OpenAI", { promptLength: prompt.length });

		return `OpenAI response for: ${prompt.substring(0, 50)}...`;
	}
}
