"use server";

import { apiRequest } from "../../shared/api-client";
import type { DeleteInput } from "../../shared/types";

export const deleteTask = ({ id }: DeleteInput) =>
	apiRequest<null>(`/tasks/${id}`, {
		method: "DELETE",
	});
