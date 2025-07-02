import { promises as fs } from "node:fs";
import { join } from "node:path";
import MarkdownIt from "markdown-it";
import type { ReviewStyle } from "../types/reviewStyle.js";
import { logger } from "./logger.js";

const md = new MarkdownIt();

const DEFAULT_REVIEW_STYLE: ReviewStyle = {
	tone: "중립적이고 명확하게",
	preferredPhrases: [
		"제안드립니다",
		"고려해보시면 좋을 것 같습니다",
		"개선할 수 있을 것 같습니다",
	],
	avoidedPhrases: ["틀렸습니다", "왜 이렇게 했나요?"],
	namingConventionHint: "일관된 명명 규칙을 사용해주세요",
};

export async function parseReviewStyle(repoPath: string): Promise<ReviewStyle> {
	const filePath = join(repoPath, ".review-style.md");

	try {
		// Check if file exists
		await fs.access(filePath);

		logger.info("Found .review-style.md, parsing...", { filePath });

		const content = await fs.readFile(filePath, "utf-8");
		const tokens = md.parse(content, {});

		const style: ReviewStyle = {};
		let currentSection: string | null = null;
		let currentList: string[] = [];

		for (const token of tokens) {
			// Handle headers
			if (token.type === "heading_open" && token.tag === "h2") {
				// Save previous section if it was a list
				if (currentSection && currentList.length > 0) {
					assignListToStyle(style, currentSection, currentList);
					currentList = [];
				}
			}

			if (token.type === "inline" && token.content) {
				const headerText = token.content.toLowerCase().trim();

				// Map header text to style properties
				if (headerText.includes("톤") || headerText.includes("tone")) {
					currentSection = "tone";
				} else if (
					headerText.includes("선호") ||
					headerText.includes("preferred")
				) {
					currentSection = "preferredPhrases";
				} else if (
					headerText.includes("피해") ||
					headerText.includes("avoid")
				) {
					currentSection = "avoidedPhrases";
				} else if (
					headerText.includes("함수") ||
					headerText.includes("naming") ||
					headerText.includes("convention")
				) {
					currentSection = "namingConventionHint";
				}

				// If it's a tone section, capture the next paragraph
				if (currentSection === "tone") {
					// Look for the next paragraph or text content
					const nextTokenIndex = tokens.indexOf(token) + 1;
					if (nextTokenIndex < tokens.length) {
						const nextToken = tokens[nextTokenIndex];
						if (nextToken && nextToken.type === "paragraph_open") {
							const paragraphContent = tokens[nextTokenIndex + 1];
							if (paragraphContent?.content) {
								style.tone = paragraphContent.content.trim();
							}
						}
					}
				}
			}

			// Handle list items
			if (token.type === "list_item_open") {
				// Find the content of this list item
				const itemIndex = tokens.indexOf(token);
				for (let i = itemIndex + 1; i < tokens.length; i++) {
					const nextToken = tokens[i];
					if (nextToken.type === "list_item_close") break;
					if (nextToken.type === "inline" && nextToken.content) {
						currentList.push(nextToken.content.trim());
						break;
					}
				}
			}

			// Handle end of lists
			if (
				token.type === "bullet_list_close" ||
				token.type === "ordered_list_close"
			) {
				if (currentSection && currentList.length > 0) {
					assignListToStyle(style, currentSection, currentList);
					currentList = [];
				}
			}
		}

		// Handle any remaining list
		if (currentSection && currentList.length > 0) {
			assignListToStyle(style, currentSection, currentList);
		}

		// Merge with defaults for missing fields
		const result = { ...DEFAULT_REVIEW_STYLE, ...style };

		logger.info("Successfully parsed review style", {
			tone: !!result.tone,
			preferredPhrases: result.preferredPhrases?.length || 0,
			avoidedPhrases: result.avoidedPhrases?.length || 0,
			namingConventionHint: !!result.namingConventionHint,
		});

		return result;
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "ENOENT"
		) {
			logger.info(".review-style.md not found, using defaults", { filePath });
		} else {
			logger.error("Error parsing .review-style.md, using defaults", {
				error: error instanceof Error ? error.message : "Unknown error",
				filePath,
			});
		}

		return DEFAULT_REVIEW_STYLE;
	}
}

function assignListToStyle(
	style: ReviewStyle,
	section: string,
	items: string[],
): void {
	switch (section) {
		case "preferredPhrases":
			style.preferredPhrases = items;
			break;
		case "avoidedPhrases":
			style.avoidedPhrases = items;
			break;
		case "namingConventionHint":
			// For naming convention, join items or take the first one
			style.namingConventionHint =
				items.length > 1 ? items.join(", ") : items[0];
			break;
	}
}