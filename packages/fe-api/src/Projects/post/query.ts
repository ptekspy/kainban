import { createMutationOptions } from "../../shared/query-factory";
import type { ProjectPostInput } from "../../shared/types";
import { postProject } from "./action";

export const postProjectMutation = createMutationOptions<
	ProjectPostInput,
	Awaited<ReturnType<typeof postProject>>
>(["projects", "post"], postProject);
