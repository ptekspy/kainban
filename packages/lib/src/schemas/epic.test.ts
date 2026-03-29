import { describe, expect, it } from "vitest";
import { epicSchema } from "./epic";

describe("epicSchema", () => {
	it("normalizes epic input", () => {
		expect(
			epicSchema.parse({
				name: "  Release Prep  ",
				description: "  Shared work  ",
			}),
		).toEqual({
			name: "Release Prep",
			description: "Shared work",
		});
	});

	it("rejects an empty epic name", () => {
		expect(() =>
			epicSchema.parse({
				name: "   ",
			}),
		).toThrow();
	});
});
