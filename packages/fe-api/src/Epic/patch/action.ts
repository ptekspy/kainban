import { apiRequest } from "../../shared/api-client";
import type { ApiEpic, EpicPatchInput } from "../../shared/types";

export const patchEpic = ({ id, ...input }: EpicPatchInput) =>
	apiRequest<ApiEpic>(`/epics/${id}`, {
		method: "PATCH",
		body: input,
	});
