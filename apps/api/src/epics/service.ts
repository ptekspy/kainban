import type { Prisma } from "../generated/prisma/client.js";
import { type createEpicRepository, epicRepository } from "./repository.js";

export const createEpicService = (repository: ReturnType<typeof createEpicRepository>) => ({
	getAll: () => repository.getAll(),
	getById: (id: string) => repository.getById(id),
	create: (data: Prisma.EpicUncheckedCreateInput) => repository.create(data),
	update: (id: string, data: Prisma.EpicUncheckedUpdateInput) => repository.update(id, data),
	delete: (id: string) => repository.delete(id),
});

export const epicService = createEpicService(epicRepository);
