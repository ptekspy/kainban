import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { createEpicController } from "./controller.js";
import { createEpicRepository } from "./repository.js";
import { createEpicService } from "./service.js";

describe("epic module", () => {
	it("repository forwards CRUD operations to Prisma", async () => {
		const db = {
			epic: {
				findMany: vi.fn().mockResolvedValue([]),
				findUnique: vi.fn().mockResolvedValue({ id: "epic-1" }),
				create: vi.fn().mockResolvedValue({ id: "epic-1" }),
				update: vi.fn().mockResolvedValue({ id: "epic-1" }),
				delete: vi.fn().mockResolvedValue({ id: "epic-1" }),
			},
		} as unknown as Parameters<typeof createEpicRepository>[0];
		const repository = createEpicRepository(db);

		await repository.getAll();
		await repository.getById("epic-1");
		await repository.create({
			name: "Platform Delivery",
			projectId: "project-1",
		});
		await repository.update("epic-1", { name: "Updated" });
		await repository.delete("epic-1");

		expect(db.epic.findMany).toHaveBeenCalledTimes(1);
		expect(db.epic.findUnique).toHaveBeenCalled();
		expect(db.epic.create).toHaveBeenCalledTimes(1);
		expect(db.epic.update).toHaveBeenCalledTimes(1);
		expect(db.epic.delete).toHaveBeenCalledTimes(1);
	});

	it("service delegates to the repository", async () => {
		const repository = {
			getAll: vi.fn().mockResolvedValue([{ id: "epic-1" }]),
			getById: vi.fn().mockResolvedValue({ id: "epic-1" }),
			create: vi.fn().mockResolvedValue({ id: "epic-1" }),
			update: vi.fn().mockResolvedValue({ id: "epic-1" }),
			delete: vi.fn().mockResolvedValue({ id: "epic-1" }),
		};
		const service = createEpicService(repository as unknown as Parameters<typeof createEpicService>[0]);

		await service.getAll();
		await service.getById("epic-1");
		await service.create({
			name: "Platform Delivery",
			projectId: "project-1",
		});
		await service.update("epic-1", { name: "Updated" });
		await service.delete("epic-1");

		expect(repository.getAll).toHaveBeenCalledTimes(1);
		expect(repository.getById).toHaveBeenCalledWith("epic-1");
		expect(repository.create).toHaveBeenCalledTimes(1);
		expect(repository.update).toHaveBeenCalledWith("epic-1", { name: "Updated" });
		expect(repository.delete).toHaveBeenCalledWith("epic-1");
	});

	it("controller exposes CRUD routes", async () => {
		const service = {
			getAll: vi.fn().mockResolvedValue([{ id: "epic-1" }]),
			getById: vi.fn().mockResolvedValueOnce({ id: "epic-1" }).mockResolvedValueOnce(null),
			create: vi.fn().mockResolvedValue({ id: "epic-1" }),
			update: vi.fn().mockResolvedValueOnce({ id: "epic-1" }).mockResolvedValueOnce(null),
			delete: vi.fn().mockResolvedValueOnce({ id: "epic-1" }).mockResolvedValueOnce(null),
		};
		const app = new Hono();
		app.route("/epics", createEpicController(service as unknown as Parameters<typeof createEpicController>[0]));

		expect((await app.request("/epics")).status).toBe(200);
		expect((await app.request("/epics/epic-1")).status).toBe(200);
		expect((await app.request("/epics/missing")).status).toBe(404);
		expect(
			(
				await app.request("/epics", {
					method: "POST",
					body: JSON.stringify({
						name: "Platform Delivery",
						projectId: "project-1",
					}),
					headers: { "Content-Type": "application/json" },
				})
			).status,
		).toBe(201);
		expect(
			(
				await app.request("/epics/epic-1", {
					method: "PATCH",
					body: JSON.stringify({ name: "Updated" }),
					headers: { "Content-Type": "application/json" },
				})
			).status,
		).toBe(200);
		expect((await app.request("/epics/epic-1", { method: "DELETE" })).status).toBe(204);
	});
});
