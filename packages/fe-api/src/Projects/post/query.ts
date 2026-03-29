import { createQueryDescriptor } from "../../shared/query-factory";
import type { ProjectPostInput } from "../../shared/types";
import { projectQueryKeys } from "../queryKeys";
import { postProject } from "./action";

export const postProjectQuery = createQueryDescriptor(
	() => projectQueryKeys.all(),
	(input: ProjectPostInput) => postProject(input),
);
