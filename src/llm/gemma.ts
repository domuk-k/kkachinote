import { logger } from "../utils/logger.js";
import { BaseLLMProvider } from "./base.js";

export class GemmaProvider extends BaseLLMProvider {
	async generateText(prompt: string): Promise<string> {
		logger.info("Generating text with Gemma", { promptLength: prompt.length });

		return `Gemma response for: ${prompt.substring(0, 50)}...`;
	}
}
