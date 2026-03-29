import { createMutationOptions } from "../../shared/query-factory";
import type { TaskPatchInput } from "../../shared/types";
import { patchTask } from "./action";

export const patchTaskMutation = createMutationOptions<
	TaskPatchInput,
	Awaited<ReturnType<typeof patchTask>>
>(["tasks", "patch"], patchTask);
