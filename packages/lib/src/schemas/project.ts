import { z } from "zod";

export const projectSchema = z.object({
	name: z.string().trim().min(1, "Project name is required."),
	abbreviation: z
		.string()
		.trim()
		.min(1, "Project abbreviation is required.")
		.transform((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
		.refine(
			(value) => value.length > 0,
			"Project abbreviation must include letters or numbers.",
		),
	githubRepoUrl: z
		.string()
		.trim()
		.url("GitHub repo URL must be a valid URL.")
		.refine((value) => {
			try {
				const hostname = new URL(value).hostname;

				return hostname === "github.com" || hostname === "www.github.com";
			} catch {
				return false;
			}
		}, "GitHub repo URL must point to github.com."),
});
