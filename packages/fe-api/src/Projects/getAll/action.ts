import { apiRequest } from "../../shared/api-client";
import type { ApiProjectRecord } from "../../shared/types";

export const getAllProjects = (options?: { headers?: HeadersInit }) =>
	apiRequest<ApiProjectRecord[]>("/projects", {
		headers: options?.headers,
	});
