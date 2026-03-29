import { createQueryDescriptor } from "../../shared/query-factory";
import type { DeleteInput } from "../../shared/types";
import { projectQueryKeys } from "../queryKeys";
import { deleteProject } from "./action";

export const deleteProjectQuery = createQueryDescriptor(
	({ id }: DeleteInput) => projectQueryKeys.byId(id),
	deleteProject,
);
