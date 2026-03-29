import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { createProjectController } from "./controller.js";
import { createProjectRepository } from "./repository.js";
import { createProjectService } from "./service.js";

describe("project module", () => {
	it("repository forwards CRUD operations to Prisma", async () => {
		const db = {
			project: {
				findMany: vi.fn().mockResolvedValue([]),
				findUnique: vi.fn().mockResolvedValue({ id: "project-1" }),
				create: vi.fn().mockResolvedValue({ id: "project-1" }),
				update: vi.fn().mockResolvedValue({ id: "project-1" }),
				delete: vi.fn().mockResolvedValue({ id: "project-1" }),
			},
		} as unknown as Parameters<typeof createProjectRepository>[0];
		const repository = createProjectRepository(db);

		await repository.getAll();
		await repository.getById("project-1");
		await repository.create({
			name: "Kainban",
			abbreviation: "KAN",
			githubRepoUrl: "https://github.com/example/kainban",
			ownerId: "user-1",
		});
		await repository.update("project-1", { name: "Updated" });
		await repository.delete("project-1");

		expect(db.project.findMany).toHaveBeenCalledTimes(1);
		expect(db.project.findUnique).toHaveBeenCalled();
		expect(db.project.create).toHaveBeenCalledTimes(1);
		expect(db.project.update).toHaveBeenCalledTimes(1);
		expect(db.project.delete).toHaveBeenCalledTimes(1);
	});

	it("service delegates to the repository", async () => {
		const repository = {
			getAll: vi.fn().mockResolvedValue([{ id: "project-1" }]),
			getById: vi.fn().mockResolvedValue({ id: "project-1" }),
			create: vi.fn().mockResolvedValue({ id: "project-1" }),
			update: vi.fn().mockResolvedValue({ id: "project-1" }),
			delete: vi.fn().mockResolvedValue({ id: "project-1" }),
		};
		const service = createProjectService(repository as unknown as Parameters<typeof createProjectService>[0]);

		await service.getAll();
		await service.getById("project-1");
		await service.create({
			name: "Kainban",
			abbreviation: "KAN",
			githubRepoUrl: "https://github.com/example/kainban",
			ownerId: "user-1",
		});
		await service.update("project-1", { name: "Updated" });
		await service.delete("project-1");

		expect(repository.getAll).toHaveBeenCalledTimes(1);
		expect(repository.getById).toHaveBeenCalledWith("project-1");
		expect(repository.create).toHaveBeenCalledTimes(1);
		expect(repository.update).toHaveBeenCalledWith("project-1", {
			name: "Updated",
		});
		expect(repository.delete).toHaveBeenCalledWith("project-1");
	});

	it("controller exposes CRUD routes", async () => {
		const service = {
			getAll: vi.fn().mockResolvedValue([{ id: "project-1" }]),
			getById: vi.fn().mockResolvedValueOnce({ id: "project-1" }).mockResolvedValueOnce(null),
			create: vi.fn().mockResolvedValue({ id: "project-1" }),
			update: vi.fn().mockResolvedValueOnce({ id: "project-1" }).mockResolvedValueOnce(null),
			delete: vi.fn().mockResolvedValueOnce({ id: "project-1" }).mockResolvedValueOnce(null),
		};
		const app = new Hono();
		app.route(
			"/projects",
			createProjectController(service as unknown as Parameters<typeof createProjectController>[0]),
		);

		expect((await app.request("/projects")).status).toBe(200);
		expect((await app.request("/projects/project-1")).status).toBe(200);
		expect((await app.request("/projects/missing")).status).toBe(404);
		expect(
			(
				await app.request("/projects", {
					method: "POST",
					body: JSON.stringify({
						name: "Kainban",
						abbreviation: "KAN",
						githubRepoUrl: "https://github.com/example/kainban",
						ownerId: "user-1",
					}),
					headers: { "Content-Type": "application/json" },
				})
			).status,
		).toBe(201);
		expect(
			(
				await app.request("/projects/project-1", {
					method: "PATCH",
					body: JSON.stringify({ name: "Updated" }),
					headers: { "Content-Type": "application/json" },
				})
			).status,
		).toBe(200);
		expect((await app.request("/projects/project-1", { method: "DELETE" })).status).toBe(204);
	});
});
