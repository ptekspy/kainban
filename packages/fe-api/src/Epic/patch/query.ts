import { createMutationOptions } from "../../shared/query-factory";
import type { EpicPatchInput } from "../../shared/types";
import { patchEpic } from "./action";

export const patchEpicMutation = createMutationOptions<
	EpicPatchInput,
	Awaited<ReturnType<typeof patchEpic>>
>(["epics", "patch"], patchEpic);
