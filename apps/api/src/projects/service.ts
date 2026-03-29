import type { Prisma } from "../generated/prisma/client.js";
import { type createProjectRepository, projectRepository } from "./repository.js";

export const createProjectService = (repository: ReturnType<typeof createProjectRepository>) => ({
	getAll: () => repository.getAll(),
	getById: (id: string) => repository.getById(id),
	create: (data: Prisma.ProjectUncheckedCreateInput) => repository.create(data),
	update: (id: string, data: Prisma.ProjectUncheckedUpdateInput) => repository.update(id, data),
	delete: (id: string) => repository.delete(id),
});

export const projectService = createProjectService(projectRepository);
