import { createQueryDescriptor } from "../../shared/query-factory";
import { projectQueryKeys } from "../queryKeys";
import { getAllProjects } from "./action";

export const getAllProjectsQuery = createQueryDescriptor(
	() => projectQueryKeys.all(),
	() => getAllProjects(),
);
