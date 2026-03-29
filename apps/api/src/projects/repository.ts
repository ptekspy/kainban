import { prisma } from "../db/client.js";
import type { Prisma, PrismaClient } from "../generated/prisma/client.js";

const projectInclude = {
	owner: true,
	epics: true,
	tasks: {
		include: {
			epic: true,
			dependencies: true,
			dependents: true,
		},
	},
} satisfies Prisma.ProjectInclude;

export const createProjectRepository = (db: PrismaClient) => ({
	getAll: () => db.project.findMany({ include: projectInclude }),
	getById: (id: string) => db.project.findUnique({ where: { id }, include: projectInclude }),
	create: (data: Prisma.ProjectUncheckedCreateInput) => db.project.create({ data, include: projectInclude }),
	update: async (id: string, data: Prisma.ProjectUncheckedUpdateInput) => {
		const existingProject = await db.project.findUnique({ where: { id } });

		if (!existingProject) {
			return null;
		}

		return db.project.update({
			where: { id },
			data,
			include: projectInclude,
		});
	},
	delete: async (id: string) => {
		const existingProject = await db.project.findUnique({ where: { id } });

		if (!existingProject) {
			return null;
		}

		return db.project.delete({
			where: { id },
			include: projectInclude,
		});
	},
});

export const projectRepository = createProjectRepository(prisma);
