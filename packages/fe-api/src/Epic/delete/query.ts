import { createQueryDescriptor } from "../../shared/query-factory";
import type { DeleteInput } from "../../shared/types";
import { epicQueryKeys } from "../queryKeys";
import { deleteEpic } from "./action";

export const deleteEpicQuery = createQueryDescriptor(
	({ id }: DeleteInput) => epicQueryKeys.byId(id),
	deleteEpic,
);
