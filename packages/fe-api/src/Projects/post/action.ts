import { apiRequest } from "../../shared/api-client";
import type { ApiProject, ProjectPostInput } from "../../shared/types";

export const postProject = (input: ProjectPostInput) =>
	apiRequest<ApiProject>("/projects", {
		method: "POST",
		body: input,
	});
