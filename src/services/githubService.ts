import { Octokit } from "@octokit/rest";
import { appConfig } from "../config.js";
import type {
	FetchPRDiffParams,
	PRDiffResponse,
	PRFile,
} from "../types/github.js";
import { logger } from "../utils/logger.js";

export class GitHubService {
	private octokit: Octokit;

	constructor() {
		if (!appConfig.github.token) {
			throw new Error("GITHUB_TOKEN is required but not provided");
		}

		this.octokit = new Octokit({
			auth: appConfig.github.token,
		});
	}

	async fetchPullRequestDiff({
		owner,
		repo,
		prNumber,
	}: FetchPRDiffParams): Promise<PRDiffResponse> {
		try {
			logger.info("Fetching PR diff", { owner, repo, prNumber });

			const response = await this.octokit.rest.pulls.listFiles({
				owner,
				repo,
				pull_number: prNumber,
			});

			const files: PRFile[] = response.data.map((file) => ({
				filename: file.filename,
				status: file.status as PRFile["status"],
				patch: file.patch || undefined,
				additions: file.additions,
				deletions: file.deletions,
				changes: file.changes,
			}));

			logger.info("Successfully fetched PR diff", {
				owner,
				repo,
				prNumber,
				fileCount: files.length,
			});

			return { files };
		} catch (error) {
			logger.error("Failed to fetch PR diff", {
				owner,
				repo,
				prNumber,
				error: error instanceof Error ? error.message : "Unknown error",
			});

			if (error instanceof Error) {
				if (error.message.includes("Not Found")) {
					throw new Error(`PR #${prNumber} not found in ${owner}/${repo}`);
				}
				if (error.message.includes("Bad credentials")) {
					throw new Error("Invalid GitHub token");
				}
				if (error.message.includes("rate limit")) {
					throw new Error("GitHub API rate limit exceeded");
				}
			}

			throw new Error(
				`Failed to fetch PR diff: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async fetchPullRequestInfo({
		owner,
		repo,
		prNumber,
	}: FetchPRDiffParams): Promise<{
		title: string;
		body: string | null;
		htmlUrl: string;
		state: string;
		user: {
			login: string;
			avatarUrl: string;
		};
	}> {
		try {
			logger.info("Fetching PR info", { owner, repo, prNumber });

			const response = await this.octokit.rest.pulls.get({
				owner,
				repo,
				pull_number: prNumber,
			});

			const pr = response.data;

			return {
				title: pr.title,
				body: pr.body,
				htmlUrl: pr.html_url,
				state: pr.state,
				user: {
					login: pr.user?.login || "unknown",
					avatarUrl: pr.user?.avatar_url || "",
				},
			};
		} catch (error) {
			logger.error("Failed to fetch PR info", {
				owner,
				repo,
				prNumber,
				error: error instanceof Error ? error.message : "Unknown error",
			});

			throw new Error(
				`Failed to fetch PR info: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}
}

export const githubService = new GitHubService();
