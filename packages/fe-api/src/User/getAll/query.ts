import { createQueryOptions } from "../../shared/query-factory";
import { userQueryKeys } from "../queryKeys";
import { getAllUsers } from "./action";

export const getAllUsersQuery = () =>
	createQueryOptions(userQueryKeys.all(), getAllUsers);
