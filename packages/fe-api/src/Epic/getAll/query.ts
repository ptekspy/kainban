import { createQueryOptions } from "../../shared/query-factory";
import { epicQueryKeys } from "../queryKeys";
import { getAllEpics } from "./action";

export const getAllEpicsQuery = () =>
	createQueryOptions(epicQueryKeys.all(), getAllEpics);
