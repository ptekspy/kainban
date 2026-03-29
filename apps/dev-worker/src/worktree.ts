import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import {
	type createProjectWorkspaceService,
	ProjectWorkspaceError,
	projectWorkspaceService,
} from "@repo/utils/ProjectWorkspace/project-workspace";
import type { ClaimedTask } from "./task-claim.js";

const execFileAsync = promisify(execFile);
const maxBranchSlugLength = 48;

interface GitWorktreeDependencies {
	cloneProjectWorkspace: ReturnType<typeof createProjectWorkspaceService>["cloneProjectWorkspace"];
	runGit: (cwd: string, args: string[]) => Promise<string>;
	toWorktreeDirectoryName: (branchName: string) => string;
	joinPath: (...paths: string[]) => string;
	getParentDirectory: (directoryPath: string) => string;
}

export interface TaskWorktreeResult {
	branchName: string;
	repositoryPath: string;
	worktreePath: string;
}

const slugify = (value: string) =>
	value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, maxBranchSlugLength);

export const createTaskBranchName = (task: ClaimedTask) => {
	const titleSlug = slugify(task.title) || "task";
	return `dev/${task.projectAbbreviation.toLowerCase()}-${task.ticketNumber}-${titleSlug}`;
};

const parseGitWorktreeList = (output: string) => {
	const worktrees: Array<{ branch?: string; path?: string }> = [];
	let currentEntry: { branch?: string; path?: string } = {};

	for (const line of output.split("\n")) {
		if (!line.trim()) {
			if (currentEntry.path) {
				worktrees.push(currentEntry);
			}
			currentEntry = {};
			continue;
		}

		if (line.startsWith("worktree ")) {
			currentEntry.path = line.slice("worktree ".length);
			continue;
		}

		if (line.startsWith("branch ")) {
			currentEntry.branch = line.slice("branch refs/heads/".length);
		}
	}

	if (currentEntry.path) {
		worktrees.push(currentEntry);
	}

	return worktrees;
};

const defaultDependencies: GitWorktreeDependencies = {
	cloneProjectWorkspace: projectWorkspaceService.cloneProjectWorkspace,
	runGit: async (cwd, args) => {
		const { stdout } = await execFileAsync("git", ["-C", cwd, ...args]);
		return stdout.trim();
	},
	toWorktreeDirectoryName: (branchName: string) => branchName.replaceAll("/", "-"),
	joinPath: (...paths: string[]) => join(...paths),
	getParentDirectory: (directoryPath: string) => dirname(directoryPath),
};

export const createTaskWorktreeService = (
	dependencies: GitWorktreeDependencies = defaultDependencies,
) => {
	const getDefaultBaseRef = async (repositoryPath: string) => {
		try {
			const originHeadRef = await dependencies.runGit(repositoryPath, [
				"symbolic-ref",
				"refs/remotes/origin/HEAD",
			]);
			return originHeadRef.replace(/^refs\/remotes\//u, "");
		} catch {
			return "origin/main";
		}
	};

	const ensureLocalTaskBranch = async (
		branchName: string,
		repositoryPath: string,
		worktreePath: string,
	) => {
		const branchList = await dependencies.runGit(repositoryPath, [
			"branch",
			"--list",
			branchName,
			"--format=%(refname:short)",
		]);

		if (branchList.split("\n").some((branch) => branch.trim() === branchName)) {
			await dependencies.runGit(repositoryPath, ["worktree", "add", worktreePath, branchName]);
			return;
		}

		const baseRef = await getDefaultBaseRef(repositoryPath);
		await dependencies.runGit(repositoryPath, ["worktree", "add", "-b", branchName, worktreePath, baseRef]);
	};

	return {
		ensureTaskWorktree: async (
			task: ClaimedTask,
			githubPat?: string,
		): Promise<TaskWorktreeResult> => {
			const workspace = await dependencies.cloneProjectWorkspace({
				projectName: task.projectName,
				githubPat,
				githubRepoUrl: task.githubRepoUrl,
			});
			const repositoryPath = workspace.directoryPath;
			const projectWorkspacePath = dependencies.getParentDirectory(repositoryPath);
			const branchName = createTaskBranchName(task);
			const worktreePath = dependencies.joinPath(
				projectWorkspacePath,
				dependencies.toWorktreeDirectoryName(branchName),
			);

			await dependencies.runGit(repositoryPath, ["fetch", "origin"]);

			const existingWorktrees = parseGitWorktreeList(
				await dependencies.runGit(repositoryPath, ["worktree", "list", "--porcelain"]),
			);
			const matchingWorktree = existingWorktrees.find(
				(worktree) => worktree.branch === branchName || worktree.path === worktreePath,
			);

			if (matchingWorktree?.path && matchingWorktree.branch === branchName) {
				return {
					branchName,
					repositoryPath,
					worktreePath: matchingWorktree.path,
				};
			}

			if (matchingWorktree?.path && matchingWorktree.path === worktreePath) {
				throw new ProjectWorkspaceError(
					`A different worktree already exists at ${worktreePath}.`,
					"TASK_WORKTREE_PATH_CONFLICT",
					409,
				);
			}

			await ensureLocalTaskBranch(branchName, repositoryPath, worktreePath);

			return {
				branchName,
				repositoryPath,
				worktreePath,
			};
		},
	};
};