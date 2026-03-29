"use server";

import { apiRequest } from "../../shared/api-client";
import type { ApiProject, GetByIdInput } from "../../shared/types";

export const getProjectById = ({ id }: GetByIdInput) =>
	apiRequest<ApiProject>(`/projects/${id}`);
