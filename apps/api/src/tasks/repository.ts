import { prisma } from "../db/client.js";
import type { Prisma, PrismaClient } from "../generated/prisma/client.js";

const taskInclude = {
	project: true,
	epic: true,
	dependencies: true,
	dependents: true,
} satisfies Prisma.TaskInclude;

export interface TaskCreateData {
	title: string;
	description?: string | null;
	status?: Prisma.TaskCreateInput["status"];
	projectId: string;
	epicId: string;
	ticketNumber: number;
	dependencyIds?: string[];
}

export interface TaskUpdateData {
	title?: string;
	description?: string | null;
	status?: Prisma.TaskUpdateInput["status"];
	projectId?: string;
	epicId?: string;
	dependencyIds?: string[];
}

export interface TaskDependencyGraphNode {
	dependencyIds: string[];
	id: string;
	projectId: string;
}

export const createTaskRepository = (db: PrismaClient) => ({
	getAll: () => db.task.findMany({ include: taskInclude }),
	getById: (id: string) => db.task.findUnique({ where: { id }, include: taskInclude }),
	getDependencyGraphByProject: (projectId: string) =>
		db.task.findMany({
			where: { projectId },
			select: {
				id: true,
				projectId: true,
				dependencies: {
					select: {
						id: true,
					},
				},
			},
		}).then((tasks) =>
			tasks.map((task) => ({
				id: task.id,
				projectId: task.projectId,
				dependencyIds: task.dependencies.map((dependency) => dependency.id),
			} satisfies TaskDependencyGraphNode)),
		),
	getNextTicketNumber: async (projectId: string) => {
		const latestTask = await db.task.findFirst({
			where: { projectId },
			orderBy: { ticketNumber: "desc" },
		});

		return (latestTask?.ticketNumber ?? 0) + 1;
	},
	create: (data: TaskCreateData) =>
		db.task.create({
			data: {
				title: data.title,
				description: data.description,
				status: data.status,
				projectId: data.projectId,
				epicId: data.epicId,
				ticketNumber: data.ticketNumber,
				dependencies:
					data.dependencyIds && data.dependencyIds.length > 0
						? {
								connect: data.dependencyIds.map((id) => ({ id })),
							}
						: undefined,
			},
			include: taskInclude,
		}),
	update: async (id: string, data: TaskUpdateData) => {
		const existingTask = await db.task.findUnique({ where: { id } });

		if (!existingTask) {
			return null;
		}

		return db.task.update({
			where: { id },
			data: {
				title: data.title,
				description: data.description,
				status: data.status,
				projectId: data.projectId,
				epicId: data.epicId,
				dependencies:
					data.dependencyIds !== undefined
						? {
								set: data.dependencyIds.map((dependencyId) => ({
									id: dependencyId,
								})),
							}
						: undefined,
			},
			include: taskInclude,
		});
	},
	delete: async (id: string) => {
		const existingTask = await db.task.findUnique({ where: { id } });

		if (!existingTask) {
			return null;
		}

		return db.task.delete({
			where: { id },
			include: taskInclude,
		});
	},
});

export const taskRepository = createTaskRepository(prisma);
