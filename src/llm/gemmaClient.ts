import { logger } from "../utils/logger.js";
import { BaseLLMProvider } from "./base.js";

interface OllamaGenerateRequest {
	model: string;
	prompt: string;
	stream?: boolean;
	options?: {
		temperature?: number;
		top_p?: number;
		max_tokens?: number;
	};
}

interface OllamaGenerateResponse {
	response: string;
	done: boolean;
	model?: string;
	created_at?: string;
}

export class GemmaClient extends BaseLLMProvider {
	private readonly baseUrl: string;
	private readonly model: string;

	constructor(
		baseUrl: string = "http://localhost:11434",
		model: string = "llama3:latest",
	) {
		super();
		this.baseUrl = baseUrl;
		this.model = model;
	}

	async generateText(prompt: string): Promise<string> {
		try {
			logger.info("Calling Gemma via Ollama", {
				baseUrl: this.baseUrl,
				model: this.model,
				promptLength: prompt.length,
			});

			const requestBody: OllamaGenerateRequest = {
				model: this.model,
				prompt,
				stream: false,
				options: {
					temperature: 0.7,
					max_tokens: 1000,
				},
			};

			const response = await fetch(`${this.baseUrl}/api/generate`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
			}

			const data = (await response.json()) as OllamaGenerateResponse;

			if (!data.response) {
				throw new Error("Empty response from Ollama API");
			}

			logger.info("Successfully generated text with Gemma", {
				responseLength: data.response.length,
				model: data.model,
			});

			return data.response.trim();
		} catch (error) {
			logger.error("Failed to generate text with Gemma", {
				error: error instanceof Error ? error.message : "Unknown error",
				baseUrl: this.baseUrl,
				model: this.model,
			});

			if (error instanceof Error) {
				if (error.message.includes("fetch")) {
					throw new Error(
						`Failed to connect to Ollama at ${this.baseUrl}. Make sure Ollama is running with: ollama serve`,
					);
				}
				if (error.message.includes("404")) {
					throw new Error(
						`Model ${this.model} not found. Install it with: ollama pull ${this.model}`,
					);
				}
			}

			throw error;
		}
	}

	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/api/tags`);
			return response.ok;
		} catch {
			return false;
		}
	}
}
