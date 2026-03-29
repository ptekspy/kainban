import { apiRequest } from "../../shared/api-client";
import type { ApiUser } from "../../shared/types";

export const getAllUsers = () => apiRequest<ApiUser[]>("/users");
