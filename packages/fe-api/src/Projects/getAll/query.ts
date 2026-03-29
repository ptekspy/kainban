import type { Project } from "@repo/types/Kanban/types";
import { createQueryOptions } from "../../shared/query-factory";
import { mapApiProjectToProject } from "../map-project";
import { projectQueryKeys } from "../queryKeys";
import { getAllProjects } from "./action";

export const getAllProjectsQuery = (options?: { headers?: HeadersInit }) =>
	createQueryOptions<Project[]>(projectQueryKeys.all(), async () => {
		const projects = await getAllProjects(options);
		return projects.map(mapApiProjectToProject);
	});
