import { createQueryDescriptor } from "../../shared/query-factory";
import type { DeleteInput } from "../../shared/types";
import { taskQueryKeys } from "../queryKeys";
import { deleteTask } from "./action";

export const deleteTaskQuery = createQueryDescriptor(
	({ id }: DeleteInput) => taskQueryKeys.byId(id),
	deleteTask,
);
