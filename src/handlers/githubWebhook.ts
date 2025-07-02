import type { FastifyReply, FastifyRequest } from "fastify";
import { reviewPlugin } from "../plugins/reviewPlugin.js";
import { githubService } from "../services/githubService.js";
import { GitHubWebhookSchema, PRDataSchema } from "../types/github.js";
import { logger } from "../utils/logger.js";
import { parseReviewStyle } from "../utils/reviewStyleParser.js";

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

		// Generate review comments
		const diffText = diffResponse.files
			.map((file) => `--- a/${file.filename}\n+++ b/${file.filename}\n${file.patch || ""}`)
			.join("\n\n");

		logger.info("Starting review generation", {
			prNumber: prData.prNumber,
			diffLength: diffText.length,
			fileCount: diffResponse.files.length,
		});

		const reviewStyle = await parseReviewStyle(".");
		const reviewComments = await reviewPlugin({
			diff: diffText,
			style: reviewStyle,
		});

		logger.info("Review comments generated", {
			prNumber: prData.prNumber,
			commentsCount: reviewComments.length,
			comments: reviewComments,
		});

		// TODO: Post review comments to GitHub PR (requires GitHub API integration)
		logger.info("Review comments ready for posting to GitHub", {
			prNumber: prData.prNumber,
			repoFullName: prData.repo.fullName,
			commentsPreview: reviewComments.slice(0, 2),
		});

		reply.code(200).send({
			status: "processed",
			prNumber: prData.prNumber,
			filesChanged: diffResponse.files.length,
			reviewCommentsGenerated: reviewComments.length,
			reviewComments: reviewComments,
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
