import fs from "node:fs";
import { mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import { Octokit } from "octokit";

export class ProjectSetupError extends Error {
	code: string;
	status: number;

	constructor(message: string, code: string, status: number) {
		super(message);
		this.name = "ProjectSetupError";
		this.code = code;
		this.status = status;
	}
}

export class GitHubAuthRequiredError extends ProjectSetupError {
	constructor(message = "This repository needs a GitHub PAT before it can be cloned.") {
		super(message, "GITHUB_AUTH_REQUIRED", 409);
		this.name = "GitHubAuthRequiredError";
	}
}

export class ProjectWorkspaceError extends ProjectSetupError {
	constructor(
		message: string,
		code = "PROJECT_WORKSPACE_SETUP_FAILED",
		status = 400,
	) {
		super(message, code, status);
		this.name = "ProjectWorkspaceError";
	}
}

interface ParsedGitHubRepo {
	owner: string;
	repo: string;
	normalizedUrl: string;
}

interface CloneProjectWorkspaceInput {
	githubPat?: string;
	githubRepoUrl: string;
	projectName: string;
}

interface CloneProjectWorkspaceResult {
	cleanup: () => Promise<void>;
	directoryPath: string;
}

interface ProjectWorkspaceDependencies {
	cloneRepository: (input: {
		directoryPath: string;
		githubPat?: string;
		githubRepoUrl: string;
	}) => Promise<void>;
	createOctokit: (githubPat?: string) => OctokitLike;
	getDirectoryEntries: (directoryPath: string) => Promise<string[]>;
	getOriginUrl: (directoryPath: string) => Promise<string | null>;
	getWorkspaceRoot: () => string;
	makeDirectory: (directoryPath: string) => Promise<void>;
	removeDirectory: (directoryPath: string) => Promise<void>;
}

interface OctokitLike {
	rest: {
		repos: {
			get: (input: { owner: string; repo: string }) => Promise<unknown>;
		};
	};
}

const parseGitHubRepoUrl = (githubRepoUrl: string): ParsedGitHubRepo => {
	let url: URL;

	try {
		url = new URL(githubRepoUrl);
	} catch {
		throw new ProjectWorkspaceError("GitHub repo URL must be a valid URL.");
	}

	if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
		throw new ProjectWorkspaceError(
			"Project repositories must be hosted on github.com.",
			"UNSUPPORTED_GITHUB_REPOSITORY",
		);
	}

	const segments = url.pathname
		.split("/")
		.filter(Boolean)
		.map((segment) => segment.replace(/\.git$/u, ""));

	if (segments.length < 2) {
		throw new ProjectWorkspaceError(
			"GitHub repo URL must include both owner and repository name.",
			"INVALID_GITHUB_REPOSITORY",
		);
	}

	const owner = segments[0];
	const repo = segments[1];

	if (!owner || !repo) {
		throw new ProjectWorkspaceError(
			"GitHub repo URL must include both owner and repository name.",
			"INVALID_GITHUB_REPOSITORY",
		);
	}

	return {
		owner,
		repo,
		normalizedUrl: `https://github.com/${owner}/${repo}.git`,
	};
};

const toProjectDirectoryName = (projectName: string) =>
	projectName
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

const normalizeGitRemoteUrl = (gitRemoteUrl: string | null) =>
	gitRemoteUrl?.replace(/\.git$/u, "").toLowerCase() ?? null;

const defaultDependencies: ProjectWorkspaceDependencies = {
	cloneRepository: async ({ directoryPath, githubPat, githubRepoUrl }) => {
		await git.clone({
			fs,
			http,
			dir: directoryPath,
			url: githubRepoUrl,
			singleBranch: true,
			depth: 1,
			onAuth: githubPat
				? () => ({
						username: githubPat,
						password: "x-oauth-basic",
					})
				: undefined,
		});
	},
	createOctokit: (githubPat?: string) =>
		new Octokit(
			githubPat
				? {
						auth: githubPat,
					}
				: undefined,
		),
	getDirectoryEntries: async (directoryPath: string) => {
		try {
			return await readdir(directoryPath);
		} catch {
			return [];
		}
	},
	getOriginUrl: async (directoryPath: string) => {
		try {
			return (
				(await git.getConfig({
					fs,
					dir: directoryPath,
					path: "remote.origin.url",
				})) ?? null
			);
		} catch {
			return null;
		}
	},
	getWorkspaceRoot: () => {
		const workspaceRoot = process.env.WORKSPACE_ROOT;

		if (!workspaceRoot) {
			throw new ProjectWorkspaceError(
				"WORKSPACE_ROOT must be defined before project repositories can be cloned.",
				"MISSING_WORKSPACE_ROOT",
				500,
			);
		}

		return workspaceRoot;
	},
	makeDirectory: async (directoryPath: string) => {
		await mkdir(directoryPath, {
			recursive: true,
		});
	},
	removeDirectory: async (directoryPath: string) => {
		await rm(directoryPath, {
			recursive: true,
			force: true,
		});
	},
};

const isAuthErrorStatus = (status?: number) =>
	status === 401 || status === 403 || status === 404;

const getErrorStatus = (error: unknown) =>
	typeof error === "object" &&
	error !== null &&
	"status" in error &&
	typeof error.status === "number"
		? error.status
		: undefined;

export const createProjectWorkspaceService = (
	dependencies: ProjectWorkspaceDependencies = defaultDependencies,
) => {
	const ensureRepoAccess = async (input: ParsedGitHubRepo & { githubPat?: string }) => {
		try {
			await dependencies
				.createOctokit(input.githubPat)
				.rest.repos.get({
					owner: input.owner,
					repo: input.repo,
				});
		} catch (error) {
			if (isAuthErrorStatus(getErrorStatus(error))) {
				if (!input.githubPat) {
					throw new GitHubAuthRequiredError();
				}

				throw new ProjectWorkspaceError(
					"Unable to access the GitHub repository with the provided PAT.",
					"INVALID_GITHUB_PAT",
					403,
				);
			}

			throw new ProjectWorkspaceError(
				"Unable to verify access to the GitHub repository right now.",
				"GITHUB_REPOSITORY_ACCESS_FAILED",
				502,
			);
		}
	};

	const cloneProjectWorkspace = async (
		input: CloneProjectWorkspaceInput,
	): Promise<CloneProjectWorkspaceResult> => {
		const parsedRepo = parseGitHubRepoUrl(input.githubRepoUrl);
		const projectDirectoryName = toProjectDirectoryName(input.projectName);

		if (!projectDirectoryName) {
			throw new ProjectWorkspaceError(
				"Project name must include letters or numbers before creating a workspace.",
				"INVALID_PROJECT_WORKSPACE_NAME",
			);
		}

		const workspaceRoot = dependencies.getWorkspaceRoot();
		const projectDirectoryPath = join(workspaceRoot, projectDirectoryName);
		const repositoryDirectoryPath = join(projectDirectoryPath, parsedRepo.repo);
		const existingEntries = await dependencies.getDirectoryEntries(projectDirectoryPath);

		if (existingEntries.length > 0) {
			const existingOriginUrl = normalizeGitRemoteUrl(
				await dependencies.getOriginUrl(repositoryDirectoryPath),
			);

			if (
				existingOriginUrl === normalizeGitRemoteUrl(parsedRepo.normalizedUrl)
			) {
				return {
					directoryPath: repositoryDirectoryPath,
					cleanup: async () => {},
				};
			}

			throw new ProjectWorkspaceError(
				`A workspace already exists at ${projectDirectoryPath}.`,
				"PROJECT_WORKSPACE_EXISTS",
				409,
			);
		}

		await ensureRepoAccess({
			...parsedRepo,
			githubPat: input.githubPat,
		});
		await dependencies.makeDirectory(workspaceRoot);
		await dependencies.makeDirectory(projectDirectoryPath);

		try {
			await dependencies.cloneRepository({
				directoryPath: repositoryDirectoryPath,
				githubPat: input.githubPat,
				githubRepoUrl: parsedRepo.normalizedUrl,
			});
		} catch (error) {
			await dependencies.removeDirectory(projectDirectoryPath);

			throw new ProjectWorkspaceError(
				error instanceof Error
					? error.message
					: "Unable to clone the GitHub repository into the project workspace.",
				"GITHUB_REPOSITORY_CLONE_FAILED",
				502,
			);
		}

		return {
			directoryPath: repositoryDirectoryPath,
			cleanup: () => dependencies.removeDirectory(projectDirectoryPath),
		};
	};

	return {
		cloneProjectWorkspace,
	};
};

export const projectWorkspaceService = createProjectWorkspaceService();
