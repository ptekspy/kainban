"use server";

import { apiRequest } from "../../shared/api-client";
import type { ApiUser, UserPatchInput } from "../../shared/types";

export const patchUser = ({ id, ...input }: UserPatchInput) =>
	apiRequest<ApiUser>(`/users/${id}`, {
		method: "PATCH",
		body: input,
	});
