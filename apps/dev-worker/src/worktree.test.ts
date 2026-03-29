import { describe, expect, it, vi } from "vitest";
import type { ClaimedTask } from "./task-claim.js";
import { createTaskBranchName, createTaskWorktreeService } from "./worktree.js";

const claimedTask: ClaimedTask = {
	id: "task-1",
	projectAbbreviation: "KAN",
	projectId: "project-1",
	projectName: "Kainban Platform",
	githubRepoUrl: "https://github.com/ptekspy/kainban",
	ticketNumber: 27,
	title: "Implement worker checkout flow",
	description: "Create a task-specific git worktree for the claimed development item.",
};

describe("createTaskBranchName", () => {
	it("derives a branch name from the task details", () => {
		expect(createTaskBranchName(claimedTask)).toBe(
			"dev/kan-27-implement-worker-checkout-flow",
		);
	});
});

describe("createTaskWorktreeService", () => {
	it("creates a worktree for a new task branch", async () => {
		const runGit = vi
			.fn<(...args: [string, string[]]) => Promise<string>>()
			.mockResolvedValueOnce("")
			.mockResolvedValueOnce("")
			.mockResolvedValueOnce("")
			.mockResolvedValueOnce("refs/remotes/origin/main")
			.mockResolvedValueOnce("");
		const service = createTaskWorktreeService({
			cloneProjectWorkspace: vi.fn().mockResolvedValue({
				cleanup: vi.fn().mockResolvedValue(undefined),
				directoryPath: "/tmp/workspaces/kainban-platform/kainban",
			}),
			runGit,
			toWorktreeDirectoryName: (branchName) => branchName.replaceAll("/", "-"),
			joinPath: (...paths) => paths.join("/"),
			getParentDirectory: (directoryPath) => directoryPath.split("/").slice(0, -1).join("/"),
		});

		const result = await service.ensureTaskWorktree(claimedTask);

		expect(result.branchName).toBe("dev/kan-27-implement-worker-checkout-flow");
		expect(result.worktreePath).toBe(
			"/tmp/workspaces/kainban-platform/dev-kan-27-implement-worker-checkout-flow",
		);
		expect(runGit).toHaveBeenCalledWith("/tmp/workspaces/kainban-platform/kainban", ["fetch", "origin"]);
		expect(runGit).toHaveBeenCalledWith("/tmp/workspaces/kainban-platform/kainban", [
			"worktree",
			"add",
			"-b",
			"dev/kan-27-implement-worker-checkout-flow",
			"/tmp/workspaces/kainban-platform/dev-kan-27-implement-worker-checkout-flow",
			"origin/main",
		]);
	});

	it("reuses an existing matching worktree", async () => {
		const runGit = vi
			.fn<(...args: [string, string[]]) => Promise<string>>()
			.mockResolvedValueOnce("")
			.mockResolvedValueOnce([
				"worktree /tmp/workspaces/kainban-platform/dev-kan-27-implement-worker-checkout-flow",
				"branch refs/heads/dev/kan-27-implement-worker-checkout-flow",
				"",
			].join("\n"));
		const service = createTaskWorktreeService({
			cloneProjectWorkspace: vi.fn().mockResolvedValue({
				cleanup: vi.fn().mockResolvedValue(undefined),
				directoryPath: "/tmp/workspaces/kainban-platform/kainban",
			}),
			runGit,
			toWorktreeDirectoryName: (branchName) => branchName.replaceAll("/", "-"),
			joinPath: (...paths) => paths.join("/"),
			getParentDirectory: (directoryPath) => directoryPath.split("/").slice(0, -1).join("/"),
		});

		const result = await service.ensureTaskWorktree(claimedTask);

		expect(result.worktreePath).toBe(
			"/tmp/workspaces/kainban-platform/dev-kan-27-implement-worker-checkout-flow",
		);
		expect(runGit).toHaveBeenCalledTimes(2);
	});
});