import { createQueryDescriptor } from "../../shared/query-factory";
import type { EpicPatchInput } from "../../shared/types";
import { epicQueryKeys } from "../queryKeys";
import { patchEpic } from "./action";

export const patchEpicQuery = createQueryDescriptor(
	({ id }: EpicPatchInput) => epicQueryKeys.byId(id),
	(input: EpicPatchInput) => patchEpic(input),
);
