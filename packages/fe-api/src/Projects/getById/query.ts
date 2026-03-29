import type { Project } from "@repo/types/Kanban/types";
import { createParameterizedQueryOptions } from "../../shared/query-factory";
import type { GetByIdInput } from "../../shared/types";
import { mapApiProjectToProject } from "../map-project";
import { projectQueryKeys } from "../queryKeys";
import { getProjectById } from "./action";

export const getProjectByIdQuery = createParameterizedQueryOptions<
	GetByIdInput,
	Project
>(
	({ id }: GetByIdInput) => projectQueryKeys.byId(id),
	async (input) => mapApiProjectToProject(await getProjectById(input)),
);
