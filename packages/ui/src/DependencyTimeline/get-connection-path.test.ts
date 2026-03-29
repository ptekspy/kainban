import { describe, expect, it } from "vitest";
import { getConnectionPath } from "./get-connection-path";

const baseInput = {
	columnGap: 16,
	columnPadding: 16,
	columnWidth: 320,
	dependencyIndex: 0,
	dependencyTotal: 1,
	fromColumnIndex: 0,
	fromRowIndex: 0,
	headerHeight: 94,
	rowGap: 16,
	rowHeight: 220,
	toColumnIndex: 1,
	toRowIndex: 1,
};

describe("getConnectionPath", () => {
	it("creates a bezier path between dependency cards", () => {
		const path = getConnectionPath(baseInput);

		expect(path).toContain("M ");
		expect(path).toContain("C ");
	});

	it("fans out multi-dependency connections with different ports", () => {
		const firstPath = getConnectionPath({
			...baseInput,
			dependencyIndex: 0,
			dependencyTotal: 2,
		});
		const secondPath = getConnectionPath({
			...baseInput,
			dependencyIndex: 1,
			dependencyTotal: 2,
		});

		expect(firstPath).not.toBe(secondPath);
	});
});
