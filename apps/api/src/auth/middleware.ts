import type { MiddlewareHandler } from "hono";
import { auth } from "./auth.js";

export const requireAuth: MiddlewareHandler = async (c, next) => {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session?.user || !session.session) {
		return c.json({ message: "Authentication required" }, 401);
	}

	await next();
};
