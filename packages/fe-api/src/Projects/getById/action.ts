import { apiRequest } from "../../shared/api-client";
import type { ApiProjectRecord, GetByIdInput } from "../../shared/types";

export const getProjectById = ({ id }: GetByIdInput) =>
	apiRequest<ApiProjectRecord>(`/projects/${id}`);
