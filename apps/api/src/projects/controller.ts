import { Hono } from "hono";
import type { Prisma } from "../generated/prisma/client.js";
import type { RealtimePublisher } from "../realtime/realtime-server.js";
import { realtimeServer } from "../server.js";
import { ProjectSetupError } from "./project-workspace.js";
import { type createProjectService, type ProjectCreateInput, projectService } from "./service.js";

export const createProjectController = (
	service: ReturnType<typeof createProjectService>,
	realtimePublisher: RealtimePublisher = realtimeServer,
) => {
	const controller = new Hono();

	controller.get("/", async (c) => {
		const projects = await service.getAll();
		return c.json(projects);
	});

	controller.get("/:id", async (c) => {
		const project = await service.getById(c.req.param("id"));

		if (!project) {
			return c.json({ message: "Project not found" }, 404);
		}

		return c.json(project);
	});

	controller.post("/", async (c) => {
		const body = await c.req.json<ProjectCreateInput>();
		try {
			const project = await service.create(body);
			realtimePublisher.publish({
				action: "created",
				entity: "project",
				entityId: project.id,
				projectId: project.id,
				type: "project.created",
			});
			return c.json(project, 201);
		} catch (error) {
			if (error instanceof ProjectSetupError) {
				return c.json(
					{
						message: error.message,
						code: error.code,
					},
					{
						status: error.status as 400 | 403 | 409 | 500 | 502,
					},
				);
			}

			throw error;
		}
	});

	controller.patch("/:id", async (c) => {
		const body = await c.req.json<Prisma.ProjectUncheckedUpdateInput>();
		const project = await service.update(c.req.param("id"), body);

		if (!project) {
			return c.json({ message: "Project not found" }, 404);
		}

		realtimePublisher.publish({
			action: "updated",
			entity: "project",
			entityId: project.id,
			projectId: project.id,
			type: "project.updated",
		});
		return c.json(project);
	});

	controller.delete("/:id", async (c) => {
		const project = await service.delete(c.req.param("id"));

		if (!project) {
			return c.json({ message: "Project not found" }, 404);
		}

		realtimePublisher.publish({
			action: "deleted",
			entity: "project",
			entityId: project.id,
			projectId: project.id,
			type: "project.deleted",
		});
		return c.body(null, 204);
	});

	return controller;
};

export const projectController = createProjectController(projectService, realtimeServer);
