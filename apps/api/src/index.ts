import { createAdaptorServer } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { IncomingMessage } from "node:http";
import { auth } from "./auth/auth.js";
import { requireAuth } from "./auth/middleware.js";
import { epicController } from "./epics/controller.js";
import { projectController } from "./projects/controller.js";
import { realtimeServer } from "./server.js";
import { taskController } from "./tasks/controller.js";
import { userController } from "./users/controller.js";

const app = new Hono();

app.use(
	"*",
	cors({
		origin: ["http://localhost:4000", "http://127.0.0.1:4000"],
		allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
		credentials: true,
	}),
);

app.get("/", (c) => {
	return c.json({
		name: "kainban-api",
		status: "ok",
	});
});

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.use("/users/*", requireAuth);
app.use("/projects/*", requireAuth);
app.use("/epics/*", requireAuth);
app.use("/tasks/*", requireAuth);

app.route("/users", userController);
app.route("/projects", projectController);
app.route("/epics", epicController);
app.route("/tasks", taskController);

const server = createAdaptorServer({
	fetch: app.fetch,
});

const createRequestHeaders = (request: IncomingMessage) => {
	const headers = new Headers();

	for (const [key, value] of Object.entries(request.headers)) {
		if (Array.isArray(value)) {
			for (const entry of value) {
				headers.append(key, entry);
			}
			continue;
		}

		if (value) {
			headers.append(key, value);
		}
	}

	return headers;
};

server.on("upgrade", async (request: IncomingMessage, socket, head) => {
	const origin = request.headers.origin;

	if (
		origin &&
		origin !== "http://localhost:4000" &&
		origin !== "http://127.0.0.1:4000"
	) {
		socket.destroy();
		return;
	}

	const url = new URL(request.url ?? "/", "http://localhost:4001");
	if (url.pathname !== "/ws") {
		socket.destroy();
		return;
	}

	const session = await auth.api.getSession({
		headers: createRequestHeaders(request),
	});

	if (!session?.user) {
		socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
		socket.destroy();
		return;
	}

	realtimeServer.handleUpgrade(request, socket, head, () => {});
});

server.listen(4001, () => {
	console.log("Server is running on http://localhost:4001");
});
