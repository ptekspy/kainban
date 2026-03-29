import { createMutationOptions } from "../../shared/query-factory";
import type { ProjectPatchInput } from "../../shared/types";
import { patchProject } from "./action";

export const patchProjectMutation = createMutationOptions<
	ProjectPatchInput,
	Awaited<ReturnType<typeof patchProject>>
>(["projects", "patch"], patchProject);
