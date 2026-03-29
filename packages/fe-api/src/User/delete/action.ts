"use server";

import { apiRequest } from "../../shared/api-client";
import type { DeleteInput } from "../../shared/types";

export const deleteUser = ({ id }: DeleteInput) =>
	apiRequest<null>(`/users/${id}`, {
		method: "DELETE",
	});
