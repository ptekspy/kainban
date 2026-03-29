import { Hono } from "hono";
import type { Prisma } from "../generated/prisma/client.js";
import { type createEpicService, epicService } from "./service.js";

export const createEpicController = (service: ReturnType<typeof createEpicService>) => {
	const controller = new Hono();

	controller.get("/", async (c) => {
		const epics = await service.getAll();
		return c.json(epics);
	});

	controller.get("/:id", async (c) => {
		const epic = await service.getById(c.req.param("id"));

		if (!epic) {
			return c.json({ message: "Epic not found" }, 404);
		}

		return c.json(epic);
	});

	controller.post("/", async (c) => {
		const body = await c.req.json<Prisma.EpicUncheckedCreateInput>();
		const epic = await service.create(body);
		return c.json(epic, 201);
	});

	controller.patch("/:id", async (c) => {
		const body = await c.req.json<Prisma.EpicUncheckedUpdateInput>();
		const epic = await service.update(c.req.param("id"), body);

		if (!epic) {
			return c.json({ message: "Epic not found" }, 404);
		}

		return c.json(epic);
	});

	controller.delete("/:id", async (c) => {
		const epic = await service.delete(c.req.param("id"));

		if (!epic) {
			return c.json({ message: "Epic not found" }, 404);
		}

		return c.body(null, 204);
	});

	return controller;
};

export const epicController = createEpicController(epicService);
