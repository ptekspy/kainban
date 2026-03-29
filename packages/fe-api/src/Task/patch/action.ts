import { apiRequest } from "../../shared/api-client";
import type { ApiTask, TaskPatchInput } from "../../shared/types";

export const patchTask = ({ id, ...input }: TaskPatchInput) =>
	apiRequest<ApiTask>(`/tasks/${id}`, {
		method: "PATCH",
		body: input,
	});
