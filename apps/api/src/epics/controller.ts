import { Hono } from "hono";
import type { Prisma } from "../generated/prisma/client.js";
import type { RealtimePublisher } from "../realtime/realtime-server.js";
import { realtimeServer } from "../server.js";
import { type createEpicService, epicService } from "./service.js";

export const createEpicController = (
	service: ReturnType<typeof createEpicService>,
	realtimePublisher: RealtimePublisher = realtimeServer,
) => {
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
		realtimePublisher.publish({
			action: "created",
			entity: "epic",
			entityId: epic.id,
			projectId: epic.projectId,
			type: "epic.created",
		});
		return c.json(epic, 201);
	});

	controller.patch("/:id", async (c) => {
		const body = await c.req.json<Prisma.EpicUncheckedUpdateInput>();
		const epic = await service.update(c.req.param("id"), body);

		if (!epic) {
			return c.json({ message: "Epic not found" }, 404);
		}

		realtimePublisher.publish({
			action: "updated",
			entity: "epic",
			entityId: epic.id,
			projectId: epic.projectId,
			type: "epic.updated",
		});
		return c.json(epic);
	});

	controller.delete("/:id", async (c) => {
		const epic = await service.delete(c.req.param("id"));

		if (!epic) {
			return c.json({ message: "Epic not found" }, 404);
		}

		realtimePublisher.publish({
			action: "deleted",
			entity: "epic",
			entityId: epic.id,
			projectId: epic.projectId,
			type: "epic.deleted",
		});
		return c.body(null, 204);
	});

	return controller;
};

export const epicController = createEpicController(epicService, realtimeServer);
