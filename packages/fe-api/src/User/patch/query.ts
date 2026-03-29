import { createQueryDescriptor } from "../../shared/query-factory";
import type { UserPatchInput } from "../../shared/types";
import { userQueryKeys } from "../queryKeys";
import { patchUser } from "./action";

export const patchUserQuery = createQueryDescriptor(
	({ id }: UserPatchInput) => userQueryKeys.byId(id),
	(input: UserPatchInput) => patchUser(input),
);
