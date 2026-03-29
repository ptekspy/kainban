import { createQueryDescriptor } from "../../shared/query-factory";
import type { TaskPatchInput } from "../../shared/types";
import { taskQueryKeys } from "../queryKeys";
import { patchTask } from "./action";

export const patchTaskQuery = createQueryDescriptor(
	({ id }: TaskPatchInput) => taskQueryKeys.byId(id),
	(input: TaskPatchInput) => patchTask(input),
);
