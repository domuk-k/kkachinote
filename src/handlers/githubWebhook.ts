import type { FastifyReply, FastifyRequest } from "fastify";
import { githubService } from "../services/githubService.js";
import { GitHubWebhookSchema, PRDataSchema } from "../types/github.js";
import { logger } from "../utils/logger.js";

const SUPPORTED_ACTIONS = ["opened", "reopened", "synchronize"] as const;

export async function githubWebhookHandler(
	request: FastifyRequest,
	reply: FastifyReply,
): Promise<void> {
	try {
		const eventType = request.headers["x-github-event"];

		if (eventType !== "pull_request") {
			logger.info("Ignoring non-pull_request event", { eventType });
			reply
				.code(200)
				.send({ status: "ignored", reason: "not a pull_request event" });
			return;
		}

		const payload = GitHubWebhookSchema.parse(request.body);

		if (
			!SUPPORTED_ACTIONS.includes(
				payload.action as (typeof SUPPORTED_ACTIONS)[number],
			)
		) {
			logger.info("Ignoring unsupported PR action", { action: payload.action });
			reply.code(200).send({ status: "ignored", reason: "unsupported action" });
			return;
		}

		if (!payload.pull_request) {
			logger.error("Missing pull_request in payload");
			reply.code(400).send({ error: "Missing pull_request in payload" });
			return;
		}

		const prData = PRDataSchema.parse({
			prNumber: payload.pull_request.number,
			prTitle: payload.pull_request.title,
			prBody: payload.pull_request.body || "",
			prHtmlUrl: payload.pull_request.html_url,
			repo: {
				owner: payload.repository.owner.login,
				name: payload.repository.name,
				fullName: payload.repository.full_name,
			},
			sender: {
				login: payload.sender.login,
				avatarUrl: payload.sender.avatar_url,
			},
			action: payload.action,
		});

		logger.info("Processing PR webhook", {
			prNumber: prData.prNumber,
			action: prData.action,
			repo: prData.repo.fullName,
		});

		// Fetch PR diff and files
		const diffResponse = await githubService.fetchPullRequestDiff({
			owner: prData.repo.owner,
			repo: prData.repo.name,
			prNumber: prData.prNumber,
		});

		logger.info("PR diff fetched successfully", {
			prNumber: prData.prNumber,
			fileCount: diffResponse.files.length,
			filesWithPatches: diffResponse.files.filter((f) => f.patch).length,
		});

		// TODO: Pass to review plugins (Step 4-5)
		// TODO: Generate PR review/summary (Step 6-7)

		reply.code(200).send({
			status: "received",
			prNumber: prData.prNumber,
			filesChanged: diffResponse.files.length,
		});
	} catch (error) {
		logger.error("GitHub webhook handler error", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});

		reply.code(500).send({
			error: "Internal server error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
}
