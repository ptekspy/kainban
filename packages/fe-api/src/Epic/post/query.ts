import { createQueryDescriptor } from "../../shared/query-factory";
import type { EpicPostInput } from "../../shared/types";
import { epicQueryKeys } from "../queryKeys";
import { postEpic } from "./action";

export const postEpicQuery = createQueryDescriptor(
	() => epicQueryKeys.all(),
	(input: EpicPostInput) => postEpic(input),
);
