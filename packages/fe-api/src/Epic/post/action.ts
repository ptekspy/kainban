import { apiRequest } from "../../shared/api-client";
import type { ApiEpic, EpicPostInput } from "../../shared/types";

export const postEpic = (input: EpicPostInput) =>
	apiRequest<ApiEpic>("/epics", {
		method: "POST",
		body: input,
	});
