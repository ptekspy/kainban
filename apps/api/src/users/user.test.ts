import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { createUserController } from "./controller.js";
import { createUserRepository } from "./repository.js";
import { createUserService } from "./service.js";

describe("user module", () => {
	it("repository forwards CRUD operations to Prisma", async () => {
		const db = {
			user: {
				findMany: vi.fn().mockResolvedValue([]),
				findUnique: vi.fn().mockResolvedValue({ id: "user-1" }),
				create: vi.fn().mockResolvedValue({ id: "user-1" }),
				update: vi.fn().mockResolvedValue({ id: "user-1" }),
				delete: vi.fn().mockResolvedValue({ id: "user-1" }),
			},
		} as unknown as Parameters<typeof createUserRepository>[0];
		const repository = createUserRepository(db);

		await repository.getAll();
		await repository.getById("user-1");
		await repository.create({ email: "user@example.com", name: "User" });
		await repository.update("user-1", { name: "Updated" });
		await repository.delete("user-1");

		expect(db.user.findMany).toHaveBeenCalledTimes(1);
		expect(db.user.findUnique).toHaveBeenCalled();
		expect(db.user.create).toHaveBeenCalledTimes(1);
		expect(db.user.update).toHaveBeenCalledTimes(1);
		expect(db.user.delete).toHaveBeenCalledTimes(1);
	});

	it("service delegates to the repository", async () => {
		const repository = {
			getAll: vi.fn().mockResolvedValue([{ id: "user-1" }]),
			getById: vi.fn().mockResolvedValue({ id: "user-1" }),
			create: vi.fn().mockResolvedValue({ id: "user-1" }),
			update: vi.fn().mockResolvedValue({ id: "user-1" }),
			delete: vi.fn().mockResolvedValue({ id: "user-1" }),
		};
		const service = createUserService(repository as unknown as Parameters<typeof createUserService>[0]);

		await service.getAll();
		await service.getById("user-1");
		await service.create({ email: "user@example.com", name: "User" });
		await service.update("user-1", { name: "Updated" });
		await service.delete("user-1");

		expect(repository.getAll).toHaveBeenCalledTimes(1);
		expect(repository.getById).toHaveBeenCalledWith("user-1");
		expect(repository.create).toHaveBeenCalledTimes(1);
		expect(repository.update).toHaveBeenCalledWith("user-1", { name: "Updated" });
		expect(repository.delete).toHaveBeenCalledWith("user-1");
	});

	it("controller exposes CRUD routes", async () => {
		const service = {
			getAll: vi.fn().mockResolvedValue([{ id: "user-1" }]),
			getById: vi.fn().mockResolvedValueOnce({ id: "user-1" }).mockResolvedValueOnce(null),
			create: vi.fn().mockResolvedValue({ id: "user-1" }),
			update: vi.fn().mockResolvedValueOnce({ id: "user-1" }).mockResolvedValueOnce(null),
			delete: vi.fn().mockResolvedValueOnce({ id: "user-1" }).mockResolvedValueOnce(null),
		};
		const app = new Hono();
		app.route("/users", createUserController(service as unknown as Parameters<typeof createUserController>[0]));

		expect((await app.request("/users")).status).toBe(200);
		expect((await app.request("/users/user-1")).status).toBe(200);
		expect((await app.request("/users/missing")).status).toBe(404);
		expect(
			(
				await app.request("/users", {
					method: "POST",
					body: JSON.stringify({ email: "user@example.com", name: "User" }),
					headers: { "Content-Type": "application/json" },
				})
			).status,
		).toBe(201);
		expect(
			(
				await app.request("/users/user-1", {
					method: "PATCH",
					body: JSON.stringify({ name: "Updated" }),
					headers: { "Content-Type": "application/json" },
				})
			).status,
		).toBe(200);
		expect(
			(
				await app.request("/users/missing", {
					method: "PATCH",
					body: JSON.stringify({ name: "Updated" }),
					headers: { "Content-Type": "application/json" },
				})
			).status,
		).toBe(404);
		expect((await app.request("/users/user-1", { method: "DELETE" })).status).toBe(204);
		expect((await app.request("/users/missing", { method: "DELETE" })).status).toBe(404);
	});
});
