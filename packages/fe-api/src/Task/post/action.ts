"use server";

import { apiRequest } from "../../shared/api-client";
import type { ApiTask, TaskPostInput } from "../../shared/types";

export const postTask = (input: TaskPostInput) =>
	apiRequest<ApiTask>("/tasks", {
		method: "POST",
		body: input,
	});
