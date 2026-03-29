import { createQueryDescriptor } from "../../shared/query-factory";
import { taskQueryKeys } from "../queryKeys";
import { getAllTasks } from "./action";

export const getAllTasksQuery = createQueryDescriptor(
	() => taskQueryKeys.all(),
	() => getAllTasks(),
);
