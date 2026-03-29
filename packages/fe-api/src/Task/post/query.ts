import { createQueryDescriptor } from "../../shared/query-factory";
import type { TaskPostInput } from "../../shared/types";
import { taskQueryKeys } from "../queryKeys";
import { postTask } from "./action";

export const postTaskQuery = createQueryDescriptor(
	() => taskQueryKeys.all(),
	(input: TaskPostInput) => postTask(input),
);
