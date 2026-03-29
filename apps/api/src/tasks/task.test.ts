import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { TaskStatus } from "../generated/prisma/client.js";
import { createTaskController } from "./controller.js";
import { createTaskRepository } from "./repository.js";
import { createTaskService, TaskDependencyValidationError } from "./service.js";

describe("task module", () => {
	it("repository forwards CRUD operations to Prisma", async () => {
		const db = {
			task: {
				findMany: vi.fn().mockResolvedValue([]),
				findUnique: vi.fn().mockResolvedValue({ id: "task-1" }),
				findFirst: vi.fn().mockResolvedValue({ ticketNumber: 3 }),
				create: vi.fn().mockResolvedValue({ id: "task-1" }),
				update: vi.fn().mockResolvedValue({ id: "task-1" }),
				delete: vi.fn().mockResolvedValue({ id: "task-1" }),
			},
		} as unknown as Parameters<typeof createTaskRepository>[0];
		const repository = createTaskRepository(db);

		await repository.getAll();
		await repository.getQueueOverview();
		await repository.getById("task-1");
		await repository.getDependencyGraphByProject("project-1");
		expect(await repository.getNextTicketNumber("project-1")).toBe(4);
		await repository.create({
			title: "Implement auth",
			projectId: "project-1",
			epicId: "epic-1",
			ticketNumber: 4,
			dependencyIds: ["task-0"],
		});
		await repository.update("task-1", {
			title: "Updated",
			dependencyIds: ["task-0"],
		});
		await repository.delete("task-1");

		expect(db.task.findMany).toHaveBeenCalledTimes(3);
		expect(db.task.findUnique).toHaveBeenCalled();
		expect(db.task.findFirst).toHaveBeenCalledTimes(1);
		expect(db.task.create).toHaveBeenCalledTimes(1);
		expect(db.task.update).toHaveBeenCalledTimes(1);
		expect(db.task.delete).toHaveBeenCalledTimes(1);
	});

	it("service assigns the next ticket number", async () => {
		const repository = {
			getAll: vi.fn().mockResolvedValue([{ id: "task-1" }]),
			getQueueOverview: vi.fn().mockResolvedValue({
				activeTasks: [],
				queuedTasks: [],
				blockedTasks: [],
				summary: { activeCount: 0, blockedCount: 0, queuedCount: 0 },
			}),
			getById: vi.fn().mockResolvedValue({ id: "task-1" }),
			getDependencyGraphByProject: vi.fn().mockResolvedValue([
				{
					id: "task-0",
					projectId: "project-1",
					dependencyIds: [],
				},
			]),
			getNextTicketNumber: vi.fn().mockResolvedValue(4),
			create: vi.fn().mockResolvedValue({ id: "task-1", ticketNumber: 4 }),
			update: vi.fn().mockResolvedValue({ id: "task-1" }),
			delete: vi.fn().mockResolvedValue({ id: "task-1" }),
		};
		const service = createTaskService(repository as unknown as Parameters<typeof createTaskService>[0]);

		await service.create({
			title: "Implement auth",
			projectId: "project-1",
			epicId: "epic-1",
			status: TaskStatus.TODO,
			dependencyIds: ["task-0"],
		});

		expect(repository.getNextTicketNumber).toHaveBeenCalledWith("project-1");
		expect(repository.create).toHaveBeenCalledWith({
			title: "Implement auth",
			projectId: "project-1",
			epicId: "epic-1",
			status: TaskStatus.TODO,
			dependencyIds: ["task-0"],
			ticketNumber: 4,
		});
	});

	it("prevents circular dependency updates", async () => {
		const repository = {
			getAll: vi.fn(),
			getById: vi.fn().mockResolvedValue({
				id: "task-1",
				projectId: "project-1",
			}),
			getDependencyGraphByProject: vi.fn().mockResolvedValue([
				{
					id: "task-1",
					projectId: "project-1",
					dependencyIds: [],
				},
				{
					id: "task-2",
					projectId: "project-1",
					dependencyIds: ["task-1"],
				},
			]),
			getNextTicketNumber: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		};
		const service = createTaskService(
			repository as unknown as Parameters<typeof createTaskService>[0],
		);

		await expect(
			service.update("task-1", {
				dependencyIds: ["task-2"],
			}),
		).rejects.toMatchObject({
			code: "TASK_DEPENDENCY_CYCLE",
		});
		expect(repository.update).not.toHaveBeenCalled();
	});

	it("controller exposes CRUD routes", async () => {
		const service = {
			getAll: vi.fn().mockResolvedValue([{ id: "task-1" }]),
			getQueueOverview: vi.fn().mockResolvedValue({
				activeTasks: [],
				queuedTasks: [],
				blockedTasks: [],
				summary: { activeCount: 0, blockedCount: 0, queuedCount: 0 },
			}),
			getById: vi.fn().mockResolvedValueOnce({ id: "task-1" }).mockResolvedValueOnce(null),
			create: vi.fn().mockResolvedValue({ id: "task-1" }),
			update: vi.fn().mockResolvedValueOnce({ id: "task-1" }).mockResolvedValueOnce(null),
			delete: vi.fn().mockResolvedValueOnce({ id: "task-1" }).mockResolvedValueOnce(null),
		};
		const app = new Hono();
		app.route("/tasks", createTaskController(service as unknown as Parameters<typeof createTaskController>[0]));

		expect((await app.request("/tasks/queue")).status).toBe(200);
		expect((await app.request("/tasks")).status).toBe(200);
		expect((await app.request("/tasks/task-1")).status).toBe(200);
		expect((await app.request("/tasks/missing")).status).toBe(404);
		expect(
			(
				await app.request("/tasks", {
					method: "POST",
					body: JSON.stringify({
						title: "Implement auth",
						projectId: "project-1",
						epicId: "epic-1",
						dependencyIds: ["task-0"],
					}),
					headers: { "Content-Type": "application/json" },
				})
			).status,
		).toBe(201);
		expect(
			(
				await app.request("/tasks/task-1", {
					method: "PATCH",
					body: JSON.stringify({ title: "Updated" }),
					headers: { "Content-Type": "application/json" },
				})
			).status,
		).toBe(200);
		expect((await app.request("/tasks/task-1", { method: "DELETE" })).status).toBe(204);
	});

	it("returns a structured dependency validation error", async () => {
		const service = {
			getAll: vi.fn(),
			getById: vi.fn(),
			create: vi.fn(),
			update: vi.fn().mockRejectedValue(
				new TaskDependencyValidationError(
					"That dependency change would create a circular task chain.",
					"TASK_DEPENDENCY_CYCLE",
				),
			),
			delete: vi.fn(),
		};
		const app = new Hono();
		app.route(
			"/tasks",
			createTaskController(
				service as unknown as Parameters<typeof createTaskController>[0],
			),
		);

		const response = await app.request("/tasks/task-1", {
			method: "PATCH",
			body: JSON.stringify({
				dependencyIds: ["task-2"],
			}),
			headers: { "Content-Type": "application/json" },
		});

		expect(response.status).toBe(409);
		await expect(response.json()).resolves.toEqual({
			message: "That dependency change would create a circular task chain.",
			code: "TASK_DEPENDENCY_CYCLE",
		});
	});
});
