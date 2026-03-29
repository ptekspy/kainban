import { prisma } from "../db/client.js";
import type { Prisma, PrismaClient } from "../generated/prisma/client.js";

const userInclude = {
	projects: true,
} satisfies Prisma.UserInclude;

export const createUserRepository = (db: PrismaClient) => ({
	getAll: () => db.user.findMany({ include: userInclude }),
	getById: (id: string) => db.user.findUnique({ where: { id }, include: userInclude }),
	create: (data: Prisma.UserCreateInput) => db.user.create({ data, include: userInclude }),
	update: async (id: string, data: Prisma.UserUpdateInput) => {
		const existingUser = await db.user.findUnique({ where: { id } });

		if (!existingUser) {
			return null;
		}

		return db.user.update({
			where: { id },
			data,
			include: userInclude,
		});
	},
	delete: async (id: string) => {
		const existingUser = await db.user.findUnique({ where: { id } });

		if (!existingUser) {
			return null;
		}

		return db.user.delete({
			where: { id },
			include: userInclude,
		});
	},
});

export const userRepository = createUserRepository(prisma);
