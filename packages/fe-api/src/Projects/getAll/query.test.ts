import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

vi.mock("./action", () => ({
	getAllProjects: vi.fn(),
}));

import { postProjectMutation } from "../post/query";
import { getAllProjects } from "./action";
import { getAllProjectsQuery } from "./query";

describe("project query helpers", () => {
	it("returns query options that map projects for the kanban board", async () => {
		vi.mocked(getAllProjects).mockResolvedValue([
			{
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
				epics: [],
				tasks: [],
			},
		]);

		const queryClient = new QueryClient();

		expect(getAllProjectsQuery().queryKey).toEqual(["projects"]);
		await expect(
			queryClient.fetchQuery(getAllProjectsQuery()),
		).resolves.toEqual([
				{
					id: "project-kainban",
					name: "Kainban",
					abbreviation: "KAN",
					githubRepoUrl: "https://github.com/example/kainban",
					epics: [],
					tasks: [],
				},
		]);
	});

	it("returns mutation options suitable for useMutation", () => {
		expect(postProjectMutation.mutationKey).toEqual(["projects", "post"]);
		expect(postProjectMutation.mutationFn).toBeTypeOf("function");
	});
});
