import { describe, expect, it } from "vitest";
import { MOCK_PROJECTS } from "@repo/constants/Kanban/mock-projects";
import { getProjectTimeline } from "./get-project-timeline";

const primaryProject = MOCK_PROJECTS[0]!;

describe("getProjectTimeline", () => {
	it("groups tasks into dependency-depth columns", () => {
		const timeline = getProjectTimeline(primaryProject);

		expect(timeline).toHaveLength(3);
		expect(timeline[0]).toMatchObject({
			depth: 0,
			title: "Starting tasks",
		});
		expect(timeline[0]?.tasks.map((task) => task.id)).toEqual(["KAN-1"]);
		expect(timeline[1]?.tasks.map((task) => task.id)).toEqual(["KAN-2"]);
		expect(timeline[2]?.tasks.map((task) => task.id)).toEqual(["KAN-3"]);
	});

	it("places multi-dependency tasks after the deepest dependency path", () => {
		const timeline = getProjectTimeline({
			...primaryProject,
			tasks: [
				{
					id: "KAN-1",
					title: "Foundation",
					column: "TODO",
					epicId: "kan-auth",
					dependencyTaskIds: [],
				},
				{
					id: "KAN-2",
					title: "Branch A",
					column: "TODO",
					epicId: "kan-auth",
					dependencyTaskIds: ["KAN-1"],
				},
				{
					id: "KAN-3",
					title: "Branch B",
					column: "TODO",
					epicId: "kan-platform",
					dependencyTaskIds: ["KAN-1"],
				},
				{
					id: "KAN-4",
					title: "Integration",
					column: "TODO",
					epicId: "kan-platform",
					dependencyTaskIds: ["KAN-2", "KAN-3"],
				},
			],
		});

		expect(timeline[0]?.tasks.map((task) => task.id)).toEqual(["KAN-1"]);
		expect(timeline[1]?.tasks.map((task) => task.id)).toEqual([
			"KAN-2",
			"KAN-3",
		]);
		expect(timeline[2]?.tasks.map((task) => task.id)).toEqual(["KAN-4"]);
	});

	it("tracks dependent task ids for each task", () => {
		const timeline = getProjectTimeline(primaryProject);
		const firstTask = timeline[0]?.tasks[0];

		expect(firstTask?.dependentTaskIds).toEqual(["KAN-2"]);
	});
});
