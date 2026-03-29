import type { Prisma } from "../generated/prisma/client.js";
import { type createUserRepository, userRepository } from "./repository.js";

export const createUserService = (repository: ReturnType<typeof createUserRepository>) => ({
	getAll: () => repository.getAll(),
	getById: (id: string) => repository.getById(id),
	create: (data: Prisma.UserCreateInput) => repository.create(data),
	update: (id: string, data: Prisma.UserUpdateInput) => repository.update(id, data),
	delete: (id: string) => repository.delete(id),
});

export const userService = createUserService(userRepository);
