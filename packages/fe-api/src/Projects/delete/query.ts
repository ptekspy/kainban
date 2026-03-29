import { createMutationOptions } from "../../shared/query-factory";
import type { DeleteInput } from "../../shared/types";
import { deleteProject } from "./action";

export const deleteProjectMutation = createMutationOptions<
	DeleteInput,
	Awaited<ReturnType<typeof deleteProject>>
>(["projects", "delete"], deleteProject);
