import { createQueryDescriptor } from "../../shared/query-factory";
import type { GetByIdInput } from "../../shared/types";
import { epicQueryKeys } from "../queryKeys";
import { getEpicById } from "./action";

export const getEpicByIdQuery = createQueryDescriptor(
	({ id }: GetByIdInput) => epicQueryKeys.byId(id),
	getEpicById,
);
