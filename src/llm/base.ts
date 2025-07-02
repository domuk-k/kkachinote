export interface LLMProvider {
	generateText(prompt: string): Promise<string>;
}

export abstract class BaseLLMProvider implements LLMProvider {
	abstract generateText(prompt: string): Promise<string>;
}
