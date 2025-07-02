import { appConfig } from "../config.js";
import type { LLMProvider } from "./base.js";
import { GemmaProvider } from "./gemma.js";
import { OpenAIProvider } from "./openai.js";

export function createLLMProvider(): LLMProvider {
	switch (appConfig.llm.backend.toLowerCase()) {
		case "openai":
			return new OpenAIProvider();
		default:
			return new GemmaProvider();
	}
}
