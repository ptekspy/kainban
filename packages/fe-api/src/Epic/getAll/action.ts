import { apiRequest } from "../../shared/api-client";
import type { ApiEpic } from "../../shared/types";

export const getAllEpics = () => apiRequest<ApiEpic[]>("/epics");
