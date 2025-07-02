import cors from "@fastify/cors";
import Fastify from "fastify";
import { appConfig } from "./config.js";
import { githubWebhookHandler } from "./handlers/githubWebhook.js";
import { logger } from "./utils/logger.js";
import { testReviewPlugin } from "./utils/testReviewPlugin.js";

const server = Fastify({
	logger: {
		level: process.env.LOG_LEVEL || "info",
		transport:
			process.env.NODE_ENV !== "production"
				? {
						target: "pino-pretty",
						options: {
							colorize: true,
						},
					}
				: undefined,
	},
});

server.register(cors, {
	origin: true,
});

server.post("/webhook", githubWebhookHandler);

server.get("/health", async () => {
	return { status: "ok", timestamp: new Date().toISOString() };
});

const start = async (): Promise<void> => {
	try {
		await server.listen({ port: appConfig.port, host: "0.0.0.0" });
		logger.info(`Server listening on port ${appConfig.port}`);

		// Test review plugin on startup
		await testReviewPlugin();
	} catch (err) {
		logger.error(err);
		process.exit(1);
	}
};

start();
