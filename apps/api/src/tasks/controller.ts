import { Hono } from "hono";
import type { TaskUpdateData } from "./repository.js";
import { type createTaskService, type TaskCreateInput, taskService } from "./service.js";

export const createTaskController = (service: ReturnType<typeof createTaskService>) => {
	const controller = new Hono();

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
		const task = await service.create(body);
		return c.json(task, 201);
	});

	controller.patch("/:id", async (c) => {
		const body = await c.req.json<TaskUpdateData>();
		const task = await service.update(c.req.param("id"), body);

		if (!task) {
			return c.json({ message: "Task not found" }, 404);
		}

		return c.json(task);
	});

	controller.delete("/:id", async (c) => {
		const task = await service.delete(c.req.param("id"));

		if (!task) {
			return c.json({ message: "Task not found" }, 404);
		}

		return c.body(null, 204);
	});

	return controller;
};

export const taskController = createTaskController(taskService);
