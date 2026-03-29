import { apiRequest } from "../../shared/api-client";
import type { ApiTask, GetByIdInput } from "../../shared/types";

export const getTaskById = ({ id }: GetByIdInput) =>
	apiRequest<ApiTask>(`/tasks/${id}`);
