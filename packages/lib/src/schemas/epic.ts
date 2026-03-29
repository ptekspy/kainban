import { z } from "zod";

export const epicSchema = z.object({
	name: z.string().trim().min(1, "Epic name is required."),
	description: z.string().trim().optional(),
});
