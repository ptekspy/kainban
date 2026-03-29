import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./api-client";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("apiRequest", () => {
	it("returns parsed JSON for successful responses", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({ id: "project-1" }),
			}),
		);

		await expect(apiRequest<{ id: string }>("/projects")).resolves.toEqual({
			id: "project-1",
		});
	});

	it("returns null for 204 responses", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				status: 204,
			}),
		);

		await expect(
			apiRequest<null>("/projects/project-1", { method: "DELETE" }),
		).resolves.toBeNull();
	});

	it("throws an ApiError for failed responses", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				json: async () => ({
					message: "Project not found",
					code: "PROJECT_NOT_FOUND",
				}),
			}),
		);

		await expect(apiRequest("/projects/missing")).rejects.toEqual(
			new ApiError("Project not found", 404, {
				code: "PROJECT_NOT_FOUND",
			}),
		);
	});
});
