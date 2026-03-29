import { createQueryDescriptor } from "../../shared/query-factory";
import type { UserPostInput } from "../../shared/types";
import { userQueryKeys } from "../queryKeys";
import { postUser } from "./action";

export const postUserQuery = createQueryDescriptor(
	() => userQueryKeys.all(),
	(input: UserPostInput) => postUser(input),
);
