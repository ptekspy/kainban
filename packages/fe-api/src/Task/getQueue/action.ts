import { apiRequest } from "../../shared/api-client";
import type { ApiTaskQueueOverview } from "../../shared/types";

export const getTaskQueueOverview = () =>
	apiRequest<ApiTaskQueueOverview>("/tasks/queue");