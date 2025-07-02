import { config } from "dotenv";
import { z } from "zod";

config();

const configSchema = z.object({
	PORT: z.string().default("3000"),
	GITHUB_TOKEN: z.string().optional(),
	SLACK_WEBHOOK_URL: z.string().optional(),
	LLM_BACKEND: z.string().default("gemma"),
});

const env = configSchema.parse(process.env);

export const appConfig = {
	port: Number.parseInt(env.PORT, 10),
	github: {
		token: env.GITHUB_TOKEN,
	},
	slack: {
		webhookUrl: env.SLACK_WEBHOOK_URL,
	},
	llm: {
		backend: env.LLM_BACKEND,
	},
};
