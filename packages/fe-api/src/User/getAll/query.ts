import { createQueryDescriptor } from "../../shared/query-factory";
import { userQueryKeys } from "../queryKeys";
import { getAllUsers } from "./action";

export const getAllUsersQuery = createQueryDescriptor(
	() => userQueryKeys.all(),
	() => getAllUsers(),
);
