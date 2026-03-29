"use server";

import { apiRequest } from "../../shared/api-client";
import type { ApiTask } from "../../shared/types";

export const getAllTasks = () => apiRequest<ApiTask[]>("/tasks");
