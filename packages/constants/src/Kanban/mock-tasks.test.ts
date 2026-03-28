import { describe, expect, it } from "vitest";
import { KANBAN_COLUMN_KEYS } from "./board";
import { MOCK_TASKS } from "./mock-tasks";

describe("MOCK_TASKS", () => {
	it("only uses known Kanban columns", () => {
		for (const task of MOCK_TASKS) {
			expect(KANBAN_COLUMN_KEYS).toContain(task.column);
		}
	});

	it("keeps unique task ids", () => {
		const taskIds = MOCK_TASKS.map((task) => task.id);

		expect(new Set(taskIds).size).toBe(taskIds.length);
	});
});
