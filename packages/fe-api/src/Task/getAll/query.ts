import { createQueryOptions } from "../../shared/query-factory";
import { taskQueryKeys } from "../queryKeys";
import { getAllTasks } from "./action";

export const getAllTasksQuery = () =>
	createQueryOptions(taskQueryKeys.all(), getAllTasks);
