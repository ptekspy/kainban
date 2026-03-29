import { createQueryDescriptor } from "../../shared/query-factory";
import type { GetByIdInput } from "../../shared/types";
import { projectQueryKeys } from "../queryKeys";
import { getProjectById } from "./action";

export const getProjectByIdQuery = createQueryDescriptor(
	({ id }: GetByIdInput) => projectQueryKeys.byId(id),
	getProjectById,
);
