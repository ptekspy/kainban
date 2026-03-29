import { describe, expect, it } from "vitest";
import { taskSchema } from "./task";

describe("taskSchema", () => {
	it("normalizes task input", () => {
		expect(
			taskSchema.parse({
				title: "  Ship audit log  ",
				description: "  Details  ",
				epicId: "kan-platform",
				dependencyTaskIds: ["KAN-1", "KAN-1", "KAN-2"],
			}),
		).toEqual({
			title: "Ship audit log",
			description: "Details",
			epicId: "kan-platform",
			dependencyTaskIds: ["KAN-1", "KAN-2"],
		});
	});

	it("rejects invalid task values", () => {
		expect(() =>
			taskSchema.parse({
				title: " ",
				epicId: "",
				dependencyTaskIds: [],
			}),
		).toThrow();
	});
});
