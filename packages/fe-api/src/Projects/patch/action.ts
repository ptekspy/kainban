"use server";

import { apiRequest } from "../../shared/api-client";
import type { ApiProject, ProjectPatchInput } from "../../shared/types";

export const patchProject = ({ id, ...input }: ProjectPatchInput) =>
	apiRequest<ApiProject>(`/projects/${id}`, {
		method: "PATCH",
		body: input,
	});
