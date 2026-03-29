import { createQueryDescriptor } from "../../shared/query-factory";
import type { DeleteInput } from "../../shared/types";
import { userQueryKeys } from "../queryKeys";
import { deleteUser } from "./action";

export const deleteUserQuery = createQueryDescriptor(
	({ id }: DeleteInput) => userQueryKeys.byId(id),
	deleteUser,
);
