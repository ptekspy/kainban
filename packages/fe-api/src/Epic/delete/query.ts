import { createMutationOptions } from "../../shared/query-factory";
import type { DeleteInput } from "../../shared/types";
import { deleteEpic } from "./action";

export const deleteEpicMutation = createMutationOptions<
	DeleteInput,
	Awaited<ReturnType<typeof deleteEpic>>
>(["epics", "delete"], deleteEpic);
