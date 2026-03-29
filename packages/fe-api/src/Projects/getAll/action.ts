"use server";

import { apiRequest } from "../../shared/api-client";
import type { ApiProject } from "../../shared/types";

export const getAllProjects = () => apiRequest<ApiProject[]>("/projects");
