import { apiRequest } from "../../shared/api-client";
import type { ApiUser, UserPostInput } from "../../shared/types";

export const postUser = (input: UserPostInput) =>
	apiRequest<ApiUser>("/users", {
		method: "POST",
		body: input,
	});
