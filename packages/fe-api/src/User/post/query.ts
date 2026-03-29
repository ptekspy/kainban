import { createMutationOptions } from "../../shared/query-factory";
import type { UserPostInput } from "../../shared/types";
import { postUser } from "./action";

export const postUserMutation = createMutationOptions<
	UserPostInput,
	Awaited<ReturnType<typeof postUser>>
>(["users", "post"], postUser);
