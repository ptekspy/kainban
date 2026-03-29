import { createMutationOptions } from "../../shared/query-factory";
import type { UserPatchInput } from "../../shared/types";
import { patchUser } from "./action";

export const patchUserMutation = createMutationOptions<
	UserPatchInput,
	Awaited<ReturnType<typeof patchUser>>
>(["users", "patch"], patchUser);
