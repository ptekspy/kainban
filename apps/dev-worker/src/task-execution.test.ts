import { describe, expect, it, vi } from "vitest";
import type { ClaimedTask } from "./task-claim.js";
import { createTaskExecutionService } from "./task-execution.js";

const claimedTask: ClaimedTask = {
	id: "task-1",
	projectAbbreviation: "BTM",
	projectId: "project-1",
	projectName: "Bot Market",
	githubRepoUrl: "https://github.com/ptekspy/bot-market",
	ticketNumber: 1,
	title: "Set up Nextjs",
	description: "Create the initial Next.js application scaffold for the bot marketplace.",
};

describe("createTaskExecutionService", () => {
	it("writes the generated execution note into the task worktree", async () => {
		const createDirectory = vi.fn().mockResolvedValue(undefined);
		const writeTextFile = vi.fn().mockResolvedValue(undefined);
		const generateText = vi.fn().mockResolvedValue({
			done: true,
			model: "qwen2.5:3b",
			raw: {},
			response: "# BTM-1\n\n- set up nextjs\n",
		});

		const service = createTaskExecutionService(
			{
				artifactRelativePath: ".dev-worker/execution-note.md",
				workerId: "dev-worker-1",
			},
			{
				createDirectory,
				generateText,
				getParentDirectory: (filePath) => filePath.split("/").slice(0, -1).join("/"),
				joinPath: (...paths) => paths.join("/"),
				writeTextFile,
			},
		);

		const result = await service.executeInWorktree(claimedTask, "/tmp/worktree");

		expect(createDirectory).toHaveBeenCalledWith("/tmp/worktree/.dev-worker");
		expect(generateText).toHaveBeenCalledWith(expect.stringContaining("Task title: Set up Nextjs"));
		expect(generateText).toHaveBeenCalledWith(
			expect.stringContaining(
				"Task description: Create the initial Next.js application scaffold for the bot marketplace.",
			),
		);
		expect(writeTextFile).toHaveBeenCalledWith(
			"/tmp/worktree/.dev-worker/execution-note.md",
			"# BTM-1\n\n- set up nextjs\n",
		);
		expect(result.artifactPath).toBe("/tmp/worktree/.dev-worker/execution-note.md");
	});
});