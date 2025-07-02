import { z } from "zod";

export const PRDataSchema = z.object({
	prNumber: z.number(),
	prTitle: z.string(),
	prBody: z.string(),
	prHtmlUrl: z.string(),
	repo: z.object({
		owner: z.string(),
		name: z.string(),
		fullName: z.string(),
	}),
	sender: z.object({
		login: z.string(),
		avatarUrl: z.string(),
	}),
	action: z.string(),
});

export type PRData = z.infer<typeof PRDataSchema>;

export const GitHubWebhookSchema = z.object({
	action: z.string(),
	number: z.number().optional(),
	pull_request: z
		.object({
			number: z.number(),
			title: z.string(),
			body: z.string().nullable(),
			html_url: z.string(),
		})
		.optional(),
	repository: z.object({
		owner: z.object({
			login: z.string(),
		}),
		name: z.string(),
		full_name: z.string(),
	}),
	sender: z.object({
		login: z.string(),
		avatar_url: z.string(),
	}),
});

export type GitHubWebhookPayload = z.infer<typeof GitHubWebhookSchema>;

export interface PRFile {
	filename: string;
	status: "added" | "modified" | "removed" | "renamed" | "copied" | "unchanged";
	patch?: string;
	additions?: number;
	deletions?: number;
	changes?: number;
}

export interface PRDiffResponse {
	files: PRFile[];
}

export interface FetchPRDiffParams {
	owner: string;
	repo: string;
	prNumber: number;
}
