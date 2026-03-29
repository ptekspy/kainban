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
		}
	});

	it("only uses known Kanban columns in project tasks", () => {
		for (const project of MOCK_PROJECTS) {
			for (const task of project.tasks) {
				expect(KANBAN_COLUMN_KEYS).toContain(task.column);
			}
		}
	});
});
