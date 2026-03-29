import { z } from "zod";

export const taskSchema = z.object({
	title: z.string().trim().min(1, "Task title is required."),
	description: z.string().trim().optional(),
	epicId: z.string().trim().min(1, "An epic is required for each task."),
	dependencyTaskIds: z
		.array(z.string().trim().min(1))
		.transform((value) => [...new Set(value)]),
});
