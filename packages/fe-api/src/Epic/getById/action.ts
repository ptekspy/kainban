import { apiRequest } from "../../shared/api-client";
import type { ApiEpic, GetByIdInput } from "../../shared/types";

export const getEpicById = ({ id }: GetByIdInput) =>
	apiRequest<ApiEpic>(`/epics/${id}`);
