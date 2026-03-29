import { describe, expect, it } from "vitest";
import { KANBAN_COLUMN_KEYS } from "./board";
import { MOCK_PROJECTS } from "./mock-projects";

describe("MOCK_PROJECTS", () => {
	it("provides unique project identifiers and abbreviations", () => {
		const projectIds = MOCK_PROJECTS.map((project) => project.id);
		const abbreviations = MOCK_PROJECTS.map((project) => project.abbreviation);

		expect(new Set(projectIds).size).toBe(projectIds.length);
		expect(new Set(abbreviations).size).toBe(abbreviations.length);
	});

	it("defines mandatory project metadata", () => {
		for (const project of MOCK_PROJECTS) {
			expect(project.name).toBeTruthy();
			expect(project.abbreviation).toMatch(/^[A-Z0-9]+$/);
			expect(project.githubRepoUrl).toMatch(/^https:\/\/github\.com\/.+/);
			expect(project.epics.length).toBeGreaterThan(0);
		}
	});

	it("only uses known Kanban columns in project tasks", () => {
		for (const project of MOCK_PROJECTS) {
			for (const task of project.tasks) {
				expect(KANBAN_COLUMN_KEYS).toContain(task.column);
			}
		}
	});

	it("keeps task dependencies scoped to known tasks and allows only the first task to be dependency-free", () => {
		for (const project of MOCK_PROJECTS) {
			const taskIds = new Set(project.tasks.map((task) => task.id));
			const dependencyFreeTasks = project.tasks.filter(
				(task) => task.dependencyTaskIds.length === 0,
			);

			expect(dependencyFreeTasks).toHaveLength(1);

			for (const task of project.tasks) {
				for (const dependencyTaskId of task.dependencyTaskIds) {
					expect(taskIds.has(dependencyTaskId)).toBe(true);
				}
			}
		}
	});

	it("references epics that exist on the owning project", () => {
		for (const project of MOCK_PROJECTS) {
			const epicIds = new Set(project.epics.map((epic) => epic.id));

			for (const task of project.tasks) {
				expect(epicIds.has(task.epicId)).toBe(true);
			}
		}
	});
});
