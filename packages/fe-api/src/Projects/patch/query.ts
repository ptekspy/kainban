import { createQueryDescriptor } from "../../shared/query-factory";
import type { ProjectPatchInput } from "../../shared/types";
import { projectQueryKeys } from "../queryKeys";
import { patchProject } from "./action";

export const patchProjectQuery = createQueryDescriptor(
	({ id }: ProjectPatchInput) => projectQueryKeys.byId(id),
	(input: ProjectPatchInput) => patchProject(input),
);
