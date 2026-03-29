import { createQueryDescriptor } from "../../shared/query-factory";
import { epicQueryKeys } from "../queryKeys";
import { getAllEpics } from "./action";

export const getAllEpicsQuery = createQueryDescriptor(
	() => epicQueryKeys.all(),
	() => getAllEpics(),
);
