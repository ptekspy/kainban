import type { Task } from "@repo/types/Kanban/types";
import { describe, expect, it } from "vitest";
import { updateTaskColumn } from "./update-task-column";

const tasks: Task[] = [
	{
		id: "1",
		title: "Implement authentication",
		description: "Set up user authentication using JWT.",
		column: "READY_FOR_DEVELOPMENT",
		epicId: "kan-auth",
		dependencyTaskIds: [],
	},
	{
		id: "2",
		title: "Design database schema",
		description: "Create ER diagrams and define database tables.",
		column: "IN_DEVELOPMENT",
		epicId: "kan-auth",
		dependencyTaskIds: ["1"],
	},
];

describe("updateTaskColumn", () => {
	it("moves only the targeted task to the new column", () => {
		const updatedTasks = updateTaskColumn(tasks, "1", "IN_DEVELOPMENT");

		expect(updatedTasks.find((task) => task.id === "1")?.column).toBe(
			"IN_DEVELOPMENT",
		);
		expect(updatedTasks.find((task) => task.id === "2")?.column).toBe(
			"IN_DEVELOPMENT",
		);
		expect(tasks.find((task) => task.id === "1")?.column).toBe(
			"READY_FOR_DEVELOPMENT",
		);
		expect(updatedTasks).not.toBe(tasks);
	});

	it("returns the same array when the task is missing", () => {
		const updatedTasks = updateTaskColumn(tasks, "missing", "RELEASED");

		expect(updatedTasks).toBe(tasks);
	});

	it("returns the same array when the task is already in the target column", () => {
		const updatedTasks = updateTaskColumn(tasks, "1", "READY_FOR_DEVELOPMENT");

		expect(updatedTasks).toBe(tasks);
	});
});
