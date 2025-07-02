import cors from "@fastify/cors";
import Fastify from "fastify";
import { appConfig } from "./config.js";
import { webhookHandler } from "./handlers/webhook.js";
import { logger } from "./utils/logger.js";

const server = Fastify({
	logger,
});

server.register(cors, {
	origin: true,
});

server.post("/webhook", webhookHandler);

server.get("/health", async () => {
	return { status: "ok", timestamp: new Date().toISOString() };
});

const start = async (): Promise<void> => {
	try {
		await server.listen({ port: appConfig.port, host: "0.0.0.0" });
		logger.info(`Server listening on port ${appConfig.port}`);
	} catch (err) {
		logger.error(err);
		process.exit(1);
	}
};

start();
