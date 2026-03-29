import { createParameterizedQueryOptions } from "../../shared/query-factory";
import type { GetByIdInput } from "../../shared/types";
import { taskQueryKeys } from "../queryKeys";
import { getTaskById } from "./action";

export const getTaskByIdQuery = createParameterizedQueryOptions(
	({ id }: GetByIdInput) => taskQueryKeys.byId(id),
	getTaskById,
);
