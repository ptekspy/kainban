import { prisma } from "../db/client.js";
import type { Prisma, PrismaClient } from "../generated/prisma/client.js";

const epicInclude = {
	project: true,
	tasks: {
		include: {
			dependencies: true,
			dependents: true,
			project: true,
		},
	},
} satisfies Prisma.EpicInclude;

export const createEpicRepository = (db: PrismaClient) => ({
	getAll: () => db.epic.findMany({ include: epicInclude }),
	getById: (id: string) => db.epic.findUnique({ where: { id }, include: epicInclude }),
	create: (data: Prisma.EpicUncheckedCreateInput) => db.epic.create({ data, include: epicInclude }),
	update: async (id: string, data: Prisma.EpicUncheckedUpdateInput) => {
		const existingEpic = await db.epic.findUnique({ where: { id } });

		if (!existingEpic) {
			return null;
		}

		return db.epic.update({
			where: { id },
			data,
			include: epicInclude,
		});
	},
	delete: async (id: string) => {
		const existingEpic = await db.epic.findUnique({ where: { id } });

		if (!existingEpic) {
			return null;
		}

		return db.epic.delete({
			where: { id },
			include: epicInclude,
		});
	},
});

export const epicRepository = createEpicRepository(prisma);
