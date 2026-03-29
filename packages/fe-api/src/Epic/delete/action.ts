"use server";

import { apiRequest } from "../../shared/api-client";
import type { DeleteInput } from "../../shared/types";

export const deleteEpic = ({ id }: DeleteInput) =>
	apiRequest<null>(`/epics/${id}`, {
		method: "DELETE",
	});
