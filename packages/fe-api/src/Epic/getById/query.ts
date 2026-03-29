import { createParameterizedQueryOptions } from "../../shared/query-factory";
import type { GetByIdInput } from "../../shared/types";
import { epicQueryKeys } from "../queryKeys";
import { getEpicById } from "./action";

export const getEpicByIdQuery = createParameterizedQueryOptions(
	({ id }: GetByIdInput) => epicQueryKeys.byId(id),
	getEpicById,
);
