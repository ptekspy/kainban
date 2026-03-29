import { describe, expect, it } from "vitest";
import { projectSchema } from "./project";

describe("projectSchema", () => {
	it("normalizes project input", () => {
		expect(
			projectSchema.parse({
				name: "  Client Portal  ",
				abbreviation: " cp-1 ",
				githubRepoUrl: "https://github.com/example/client-portal",
			}),
		).toEqual({
			name: "Client Portal",
			abbreviation: "CP1",
			githubRepoUrl: "https://github.com/example/client-portal",
		});
	});

	it("rejects invalid project values", () => {
		expect(() =>
			projectSchema.parse({
				name: "",
				abbreviation: "",
				githubRepoUrl: "not-a-url",
			}),
		).toThrow();
	});
});
