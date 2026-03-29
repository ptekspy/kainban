import { createMutationOptions } from "../../shared/query-factory";
import type { EpicPostInput } from "../../shared/types";
import { postEpic } from "./action";

export const postEpicMutation = createMutationOptions<
	EpicPostInput,
	Awaited<ReturnType<typeof postEpic>>
>(["epics", "post"], postEpic);
