import { createMutationOptions } from "../../shared/query-factory";
import type { TaskPostInput } from "../../shared/types";
import { postTask } from "./action";

export const postTaskMutation = createMutationOptions<
	TaskPostInput,
	Awaited<ReturnType<typeof postTask>>
>(["tasks", "post"], postTask);
