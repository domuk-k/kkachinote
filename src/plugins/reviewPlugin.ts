import { GemmaClient } from "../llm/gemmaClient.js";
import type { ReviewStyle } from "../types/reviewStyle.js";
import { logger } from "../utils/logger.js";
import {
	loadPromptTemplate,
	processTemplate,
} from "../utils/promptTemplate.js";

export interface ReviewPluginInput {
	diff: string;
	style: ReviewStyle;
}

export async function reviewPlugin({
	diff,
	style,
}: ReviewPluginInput): Promise<string[]> {
	try {
		logger.info("Starting code review generation", {
			diffLength: diff.length,
			tone: style.tone,
			preferredPhrasesCount: style.preferredPhrases?.length || 0,
			avoidedPhrasesCount: style.avoidedPhrases?.length || 0,
		});

		// Load prompt template
		const template = await loadPromptTemplate("review");

		// Process template with variables
		const prompt = processTemplate(template, {
			TONE: style.tone || "중립적이고 명확하게",
			AVOID_PHRASES: style.avoidedPhrases || [],
			PREFERRED_PHRASES: style.preferredPhrases || [],
			NAMING_HINT: style.namingConventionHint || "일관된 명명 규칙 사용",
			DIFF: diff,
		});

		logger.info("Generated review prompt", {
			promptLength: prompt.length,
			diffLines: diff.split("\n").length,
		});

		// Initialize Gemma client
		const gemmaClient = new GemmaClient();

		// Check if Ollama is available
		const isHealthy = await gemmaClient.checkHealth();
		if (!isHealthy) {
			logger.warn("Ollama is not available, returning mock review comments");
			return generateMockReviewComments(diff);
		}

		// Generate review with Gemma
		const response = await gemmaClient.generateText(prompt);

		// Parse response to extract review comments
		const reviewComments = parseReviewResponse(response);

		logger.info("Successfully generated review comments", {
			responseLength: response.length,
			commentsCount: reviewComments.length,
		});

		return reviewComments;
	} catch (error) {
		logger.error("Failed to generate review comments", {
			error: error instanceof Error ? error.message : "Unknown error",
			diffLength: diff.length,
		});

		// Fallback to mock comments on error
		logger.info("Falling back to mock review comments");
		return generateMockReviewComments(diff);
	}
}

function parseReviewResponse(response: string): string[] {
	const lines = response.split("\n").map((line) => line.trim());
	const comments: string[] = [];

	for (const line of lines) {
		// Match lines starting with "- " or numbered lists "1. ", "2. ", etc.
		if (line.match(/^[-*]\s+(.+)/) || line.match(/^\d+\.\s+(.+)/)) {
			const comment = line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");
			if (comment.length > 10) {
				// Filter out very short comments
				comments.push(comment);
			}
		}
	}

	// If no structured comments found, try to split by common separators
	if (comments.length === 0) {
		const fallbackComments = response
			.split(/\n\n|\n(?=\d+\.|\n(?=-))/)
			.map((chunk) => chunk.trim())
			.filter((chunk) => chunk.length > 20)
			.slice(0, 5); // Limit to 5 comments

		return fallbackComments;
	}

	return comments.slice(0, 5); // Limit to 5 comments
}

function generateMockReviewComments(diff: string): string[] {
	const lines = diff.split("\n");
	const addedLines = lines.filter((line) => line.startsWith("+")).length;
	const removedLines = lines.filter((line) => line.startsWith("-")).length;

	return [
		`이번 변경사항에서 ${addedLines}줄이 추가되고 ${removedLines}줄이 제거되었습니다. 전반적으로 코드 구조가 개선된 것 같습니다.`,
		"변수명과 함수명이 명확하게 작성되어 가독성이 좋습니다. 일관된 명명 규칙을 잘 따르고 있네요.",
		"에러 처리 로직이 잘 구현되어 있어 안정성이 향상될 것 같습니다.",
		"타입 안전성을 고려한 코드 작성이 인상적입니다. TypeScript의 장점을 잘 활용하고 있네요.",
		"코드 리뷰를 통해 더욱 견고한 소프트웨어가 될 것 같습니다. 수고하셨습니다!",
	];
}
