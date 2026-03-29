import { createQueryOptions } from "../../shared/query-factory";
import { taskQueryKeys } from "../queryKeys";
import { getTaskQueueOverview } from "./action";

export const getTaskQueueOverviewQuery = () =>
	createQueryOptions([...taskQueryKeys.all(), "queue"], getTaskQueueOverview);