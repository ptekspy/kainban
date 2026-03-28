import { describe, expect, it } from "vitest";
import {
	KANBAN_COLUMN_KEYS,
	KANBAN_COLUMN_SETTINGS,
	KANBAN_COLUMN_TITLES,
	KANBAN_FLOW,
} from "./board";

describe("Kanban board constants", () => {
	it("keeps titles, settings, and flow aligned with the column keys", () => {
		expect(Object.keys(KANBAN_COLUMN_TITLES)).toEqual([...KANBAN_COLUMN_KEYS]);
		expect(Object.keys(KANBAN_COLUMN_SETTINGS)).toEqual([
			...KANBAN_COLUMN_KEYS,
		]);
		expect(Object.keys(KANBAN_FLOW)).toEqual([...KANBAN_COLUMN_KEYS]);
	});

	it("defines at least one available move for every non-terminal workflow state", () => {
		expect(KANBAN_FLOW.TODO.to).toContain("READY_FOR_DEVELOPMENT");
		expect(KANBAN_FLOW.RELEASED.to).toEqual([]);
	});
});
