import { createMutationOptions } from "../../shared/query-factory";
import type { DeleteInput } from "../../shared/types";
import { deleteUser } from "./action";

export const deleteUserMutation = createMutationOptions<
	DeleteInput,
	Awaited<ReturnType<typeof deleteUser>>
>(["users", "delete"], deleteUser);
