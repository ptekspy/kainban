import { createMutationOptions } from "../../shared/query-factory";
import type { DeleteInput } from "../../shared/types";
import { deleteTask } from "./action";

export const deleteTaskMutation = createMutationOptions<
	DeleteInput,
	Awaited<ReturnType<typeof deleteTask>>
>(["tasks", "delete"], deleteTask);
