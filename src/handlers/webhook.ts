import type { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../utils/logger.js";

export async function webhookHandler(
	_request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	logger.info("Webhook received");
	reply.code(200).send({ status: "ok" });
}
