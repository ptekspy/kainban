import { describe, expect, it, vi } from "vitest";
import { createTaskClaimService, type ClaimedTask } from "./task-claim.js";

const claimedTask: ClaimedTask = {
	id: "task-1",
	projectAbbreviation: "KAN",
	projectId: "project-1",
	projectName: "Kainban",
	githubRepoUrl: "https://github.com/ptekspy/kainban",
	ticketNumber: 12,
	title: "Implement dev worker",
	description: "Build a worker process that can claim and execute development tasks.",
};

describe("createTaskClaimService", () => {
	it("claims exactly one task and keeps returning the active claim", async () => {
		const repository = {
			claimNextReadyTask: vi.fn().mockResolvedValue(claimedTask),
			assignTaskWorkspace: vi.fn().mockResolvedValue(undefined),
			returnTaskToReadyForDevelopment: vi.fn().mockResolvedValue(undefined),
		};
		const service = createTaskClaimService(repository);

		await expect(service.claimNextTask()).resolves.toEqual(claimedTask);
		await expect(service.claimNextTask()).resolves.toEqual(claimedTask);
		expect(repository.claimNextReadyTask).toHaveBeenCalledTimes(1);
	});

	it("requeues the active task and clears the lock", async () => {
		const repository = {
			claimNextReadyTask: vi.fn().mockResolvedValue(claimedTask),
			assignTaskWorkspace: vi.fn().mockResolvedValue(undefined),
			returnTaskToReadyForDevelopment: vi.fn().mockResolvedValue(undefined),
		};
		const service = createTaskClaimService(repository);

		await service.claimNextTask();
		await service.requeueActiveTask();

		expect(repository.returnTaskToReadyForDevelopment).toHaveBeenCalledWith("task-1");
		expect(service.getActiveTask()).toBeNull();
	});
});