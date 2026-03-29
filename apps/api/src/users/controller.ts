import { Hono } from "hono";
import type { Prisma } from "../generated/prisma/client.js";
import { type createUserService, userService } from "./service.js";

export const createUserController = (service: ReturnType<typeof createUserService>) => {
	const controller = new Hono();

	controller.get("/", async (c) => {
		const users = await service.getAll();
		return c.json(users);
	});

	controller.get("/:id", async (c) => {
		const user = await service.getById(c.req.param("id"));

		if (!user) {
			return c.json({ message: "User not found" }, 404);
		}

		return c.json(user);
	});

	controller.post("/", async (c) => {
		const body = await c.req.json<Prisma.UserCreateInput>();
		const user = await service.create(body);
		return c.json(user, 201);
	});

	controller.patch("/:id", async (c) => {
		const body = await c.req.json<Prisma.UserUpdateInput>();
		const user = await service.update(c.req.param("id"), body);

		if (!user) {
			return c.json({ message: "User not found" }, 404);
		}

		return c.json(user);
	});

	controller.delete("/:id", async (c) => {
		const user = await service.delete(c.req.param("id"));

		if (!user) {
			return c.json({ message: "User not found" }, 404);
		}

		return c.body(null, 204);
	});

	return controller;
};

export const userController = createUserController(userService);
