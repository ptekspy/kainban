import { describe, expect, it, vi } from "vitest";
import {
	createProjectWorkspaceService,
	GitHubAuthRequiredError,
	ProjectWorkspaceError,
} from "./project-workspace.js";

const createDependencies = () => ({
	cloneRepository: vi.fn().mockResolvedValue(undefined),
	createOctokit: vi.fn().mockReturnValue({
		rest: {
			repos: {
				get: vi.fn().mockResolvedValue({}),
			},
		},
	}),
	getDirectoryEntries: vi.fn().mockResolvedValue([]),
	getOriginUrl: vi.fn().mockResolvedValue(null),
	getWorkspaceRoot: vi.fn().mockReturnValue("/tmp/kainban-workspaces"),
	makeDirectory: vi.fn().mockResolvedValue(undefined),
	removeDirectory: vi.fn().mockResolvedValue(undefined),
});

describe("projectWorkspaceService", () => {
	it("clones a github repository into a project folder inside the workspace root", async () => {
		const dependencies = createDependencies();
		const octokit = {
			rest: {
				repos: {
					get: vi.fn().mockResolvedValue({}),
				},
			},
		};
		dependencies.createOctokit.mockReturnValue(octokit);
		const service = createProjectWorkspaceService(dependencies);

		const result = await service.cloneProjectWorkspace({
			projectName: "Client Portal",
			githubRepoUrl: "https://github.com/example/client-portal",
		});

		expect(dependencies.createOctokit).toHaveBeenCalledWith(undefined);
		expect(octokit.rest.repos.get).toHaveBeenCalledWith({
			owner: "example",
			repo: "client-portal",
		});
		expect(dependencies.cloneRepository).toHaveBeenCalledWith({
			directoryPath: "/tmp/kainban-workspaces/client-portal/client-portal",
			githubPat: undefined,
			githubRepoUrl: "https://github.com/example/client-portal.git",
		});
		expect(result.directoryPath).toBe(
			"/tmp/kainban-workspaces/client-portal/client-portal",
		);
		await result.cleanup();
		expect(dependencies.removeDirectory).toHaveBeenCalledWith(
			"/tmp/kainban-workspaces/client-portal",
		);
	});

	it("asks for github auth when the repo is not reachable without a token", async () => {
		const dependencies = createDependencies();
		const getRepository = vi.fn().mockRejectedValue({ status: 404 });
		dependencies.createOctokit.mockReturnValue({
			rest: {
				repos: {
					get: getRepository,
				},
			},
		});
		const service = createProjectWorkspaceService(dependencies);

		await expect(
			service.cloneProjectWorkspace({
				projectName: "Private Portal",
				githubRepoUrl: "https://github.com/example/private-portal",
			}),
		).rejects.toBeInstanceOf(GitHubAuthRequiredError);
		expect(dependencies.cloneRepository).not.toHaveBeenCalled();
	});

	it("reuses an existing matching workspace checkout", async () => {
		const dependencies = createDependencies();
		dependencies.getDirectoryEntries.mockResolvedValue([".git", "README.md"]);
		dependencies.getOriginUrl.mockResolvedValue(
			"https://github.com/example/client-portal.git",
		);
		const service = createProjectWorkspaceService(dependencies);

		const result = await service.cloneProjectWorkspace({
			projectName: "Client Portal",
			githubRepoUrl: "https://github.com/example/client-portal",
		});

		expect(dependencies.cloneRepository).not.toHaveBeenCalled();
		expect(result.directoryPath).toBe(
			"/tmp/kainban-workspaces/client-portal/client-portal",
		);
		await expect(result.cleanup()).resolves.toBeUndefined();
		expect(dependencies.removeDirectory).not.toHaveBeenCalled();
	});

	it("rejects a conflicting existing workspace", async () => {
		const dependencies = createDependencies();
		dependencies.getDirectoryEntries.mockResolvedValue([".git"]);
		dependencies.getOriginUrl.mockResolvedValue(
			"https://github.com/example/different-repo.git",
		);
		const service = createProjectWorkspaceService(dependencies);

		await expect(
			service.cloneProjectWorkspace({
				projectName: "Client Portal",
				githubRepoUrl: "https://github.com/example/client-portal",
			}),
		).rejects.toEqual(
			new ProjectWorkspaceError(
				"A workspace already exists at /tmp/kainban-workspaces/client-portal.",
				"PROJECT_WORKSPACE_EXISTS",
				409,
			),
		);
	});
});
