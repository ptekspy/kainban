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

const defaultWebOrigin = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:4000";
const webPort = (() => {
	try {
		return new URL(defaultWebOrigin).port || "4000";
	} catch {
		return "4000";
	}
})();
const allowedWebOrigins = [defaultWebOrigin, `http://127.0.0.1:${webPort}`];
const apiPort = Number.parseInt(process.env.API_PORT ?? process.env.PORT ?? "4001", 10);
const apiBaseUrl = process.env.BETTER_AUTH_URL ?? `http://localhost:${apiPort}`;

const app = new Hono();

app.use(
	"*",
	cors({
		origin: allowedWebOrigins,
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

	if (origin && !allowedWebOrigins.includes(origin)) {
		socket.destroy();
		return;
	}

	const url = new URL(request.url ?? "/", apiBaseUrl);
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

server.listen(apiPort, () => {
	console.log(`Server is running on http://localhost:${apiPort}`);
});
