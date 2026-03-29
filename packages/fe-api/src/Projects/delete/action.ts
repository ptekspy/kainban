import { apiRequest } from "../../shared/api-client";
import type { DeleteInput } from "../../shared/types";

export const deleteProject = ({ id }: DeleteInput) =>
	apiRequest<null>(`/projects/${id}`, {
		method: "DELETE",
	});
