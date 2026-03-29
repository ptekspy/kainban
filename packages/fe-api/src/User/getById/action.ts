import { apiRequest } from "../../shared/api-client";
import type { ApiUser, GetByIdInput } from "../../shared/types";

export const getUserById = ({ id }: GetByIdInput) =>
	apiRequest<ApiUser>(`/users/${id}`);
