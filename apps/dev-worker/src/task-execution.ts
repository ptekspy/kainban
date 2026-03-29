import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ClaimedTask } from "./task-claim.js";
import type { OllamaGenerateResult } from "./ollama-queue.js";

interface TaskExecutionDependencies {
	createDirectory: (directoryPath: string) => Promise<void>;
	joinPath: (...paths: string[]) => string;
	getParentDirectory: (filePath: string) => string;
	writeTextFile: (filePath: string, content: string) => Promise<void>;
	generateText: (prompt: string) => Promise<OllamaGenerateResult>;
}

export interface TaskExecutionConfig {
	artifactRelativePath: string;
	workerId: string;
}

export interface TaskExecutionResult {
	artifactPath: string;
	content: string;
}

const defaultDependencies: TaskExecutionDependencies = {
	createDirectory: async (directoryPath: string) => {
		await mkdir(directoryPath, { recursive: true });
	},
	joinPath: (...paths: string[]) => join(...paths),
	getParentDirectory: (filePath: string) => dirname(filePath),
	writeTextFile: (filePath: string, content: string) => writeFile(filePath, content, "utf8"),
	generateText: async () => {
		throw new Error("Task execution text generator is not configured.");
	},
};

const createTaskPrompt = (task: ClaimedTask, workerId: string) => `You are the ${workerId} dev worker.
You have claimed this software task and must prepare a concise execution note for the task worktree.

Task title: ${task.title}
Task description: ${task.description ?? "(none provided)"}
Task ticket: ${task.projectAbbreviation}-${task.ticketNumber}
Project: ${task.projectName}

Return markdown only.
Include:
1. A short heading with the task ticket and title.
2. A brief implementation intent based on the task title and description.
3. A checklist of concrete first coding steps.
4. A short testing note.
`;

export const createTaskExecutionService = (
	config: TaskExecutionConfig,
	providedDependencies: Partial<TaskExecutionDependencies> = {},
) => {
	const dependencies: TaskExecutionDependencies = {
		...defaultDependencies,
		...providedDependencies,
	};

	return {
		executeInWorktree: async (
			task: ClaimedTask,
			worktreePath: string,
		): Promise<TaskExecutionResult> => {
			const artifactPath = dependencies.joinPath(worktreePath, config.artifactRelativePath);
			await dependencies.createDirectory(dependencies.getParentDirectory(artifactPath));

			const generatedText = await dependencies.generateText(
				createTaskPrompt(task, config.workerId),
			);
			const content = generatedText.response.trim();

			if (!content) {
				throw new Error("Ollama returned an empty execution artifact.");
			}

			await dependencies.writeTextFile(`${artifactPath}`, `${content}\n`);

			return {
				artifactPath,
				content,
			};
		},
	};
};