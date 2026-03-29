import { describe, expect, it } from "vitest";
import type { ApiProjectRecord } from "../shared/types";
import { mapApiProjectToProject } from "./map-project";

describe("mapApiProjectToProject", () => {
	it("maps nested API project records into kanban projects", () => {
		const projectRecord: ApiProjectRecord = {
			id: "project-kainban",
			name: "Kainban",
			abbreviation: "KAN",
			githubRepoUrl: "https://github.com/example/kainban",
			ownerId: "user-1",
			createdAt: "2026-03-29T00:00:00.000Z",
			updatedAt: "2026-03-29T00:00:00.000Z",
			owner: {
				id: "user-1",
				email: "owner@example.com",
				name: "Owner",
			},
			epics: [
				{
					id: "epic-auth",
					name: "Auth",
					description: "Authentication work",
					projectId: "project-kainban",
					createdAt: "2026-03-29T00:00:00.000Z",
					updatedAt: "2026-03-29T00:00:00.000Z",
				},
			],
			tasks: [
				{
					id: "task-1",
					ticketNumber: 1,
					title: "Set up auth",
					description: null,
					status: "TODO",
					branchName: null,
					worktreePath: null,
					projectId: "project-kainban",
					epicId: "epic-auth",
					createdAt: "2026-03-29T00:00:00.000Z",
					updatedAt: "2026-03-29T00:00:00.000Z",
					dependencies: [{ id: "task-0", ticketNumber: 0 }],
				},
			],
		};

		expect(mapApiProjectToProject(projectRecord)).toEqual({
			id: "project-kainban",
			name: "Kainban",
			abbreviation: "KAN",
			githubRepoUrl: "https://github.com/example/kainban",
			epics: [
				{
					id: "epic-auth",
					name: "Auth",
					description: "Authentication work",
				},
			],
			tasks: [
				{
					id: "KAN-1",
					sourceId: "task-1",
					title: "Set up auth",
					description: undefined,
					column: "TODO",
					epicId: "epic-auth",
					dependencyTaskIds: ["KAN-0"],
				},
			],
		});
	});
});
