import { createParameterizedQueryOptions } from "../../shared/query-factory";
import type { GetByIdInput } from "../../shared/types";
import { userQueryKeys } from "../queryKeys";
import { getUserById } from "./action";

export const getUserByIdQuery = createParameterizedQueryOptions(
	({ id }: GetByIdInput) => userQueryKeys.byId(id),
	getUserById,
);
