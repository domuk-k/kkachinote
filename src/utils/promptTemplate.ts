import { promises as fs } from "node:fs";
import { join } from "node:path";
import { logger } from "./logger.js";

export interface TemplateVariables {
	[key: string]: string | string[] | undefined;
}

export async function loadPromptTemplate(
	templateName: string,
): Promise<string> {
	const templatePath = join(
		process.cwd(),
		"prompts",
		`${templateName}.prompt.txt`,
	);

	try {
		const content = await fs.readFile(templatePath, "utf-8");
		logger.info("Loaded prompt template", { templateName, templatePath });
		return content;
	} catch (error) {
		logger.error("Failed to load prompt template", {
			templateName,
			templatePath,
			error: error instanceof Error ? error.message : "Unknown error",
		});
		throw new Error(`Failed to load prompt template: ${templateName}`);
	}
}

export function processTemplate(
	template: string,
	variables: TemplateVariables,
): string {
	let processed = template;

	for (const [key, value] of Object.entries(variables)) {
		const placeholder = `\${${key}}`;
		let replacement: string;

		if (Array.isArray(value)) {
			replacement = value.length > 0 ? value.join(", ") : "없음";
		} else {
			replacement = value || "없음";
		}

		processed = processed.replaceAll(placeholder, replacement);
	}

	// Check for unresolved placeholders
	const unresolvedMatches = processed.match(/\$\{[^}]+\}/g);
	if (unresolvedMatches) {
		logger.warn("Found unresolved template placeholders", {
			placeholders: unresolvedMatches,
		});
	}

	return processed;
}
