import { Hono } from "hono";
import type { RealtimePublisher } from "../realtime/realtime-server.js";
import { realtimeServer } from "../server.js";
import type { TaskUpdateData } from "./repository.js";
import {
	type createTaskService,
	type TaskCreateInput,
	TaskDependencyValidationError,
	taskService,
} from "./service.js";

export const createTaskController = (
	service: ReturnType<typeof createTaskService>,
	realtimePublisher: RealtimePublisher = realtimeServer,
) => {
	const controller = new Hono();

	controller.get("/queue", async (c) => {
		const queue = await service.getQueueOverview();
		return c.json(queue);
	});

	controller.get("/", async (c) => {
		const tasks = await service.getAll();
		return c.json(tasks);
	});

	controller.get("/:id", async (c) => {
		const task = await service.getById(c.req.param("id"));

		if (!task) {
			return c.json({ message: "Task not found" }, 404);
		}

		return c.json(task);
	});

	controller.post("/", async (c) => {
		const body = await c.req.json<TaskCreateInput>();
		try {
			const task = await service.create(body);
			realtimePublisher.publish({
				action: "created",
				entity: "task",
				entityId: task.id,
				projectId: task.projectId,
				type: "task.created",
			});
			return c.json(task, 201);
		} catch (error) {
			if (error instanceof TaskDependencyValidationError) {
				return c.json(
					{
						message: error.message,
						code: error.code,
					},
					error.status as 400 | 403 | 404 | 409,
				);
			}

			throw error;
		}
	});

	controller.patch("/:id", async (c) => {
		const body = await c.req.json<TaskUpdateData>();
		let task;

		try {
			task = await service.update(c.req.param("id"), body);
		} catch (error) {
			if (error instanceof TaskDependencyValidationError) {
				return c.json(
					{
						message: error.message,
						code: error.code,
					},
					error.status as 400 | 403 | 404 | 409,
				);
			}

			throw error;
		}

		if (!task) {
			return c.json({ message: "Task not found" }, 404);
		}

		realtimePublisher.publish({
			action: "updated",
			entity: "task",
			entityId: task.id,
			projectId: task.projectId,
			type: "task.updated",
		});
		return c.json(task);
	});

	controller.delete("/:id", async (c) => {
		const task = await service.delete(c.req.param("id"));

		if (!task) {
			return c.json({ message: "Task not found" }, 404);
		}

		realtimePublisher.publish({
			action: "deleted",
			entity: "task",
			entityId: task.id,
			projectId: task.projectId,
			type: "task.deleted",
		});
		return c.body(null, 204);
	});

	return controller;
};

export const taskController = createTaskController(taskService, realtimeServer);
