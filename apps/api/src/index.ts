import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { epicController } from "./epics/controller.js";
import { projectController } from "./projects/controller.js";
import { taskController } from "./tasks/controller.js";
import { userController } from "./users/controller.js";

const app = new Hono();

app.get("/", (c) => {
	return c.json({
		name: "kainban-api",
		status: "ok",
	});
});

app.route("/users", userController);
app.route("/projects", projectController);
app.route("/epics", epicController);
app.route("/tasks", taskController);

serve(
	{
		fetch: app.fetch,
		port: 4001,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
