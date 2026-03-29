import { prisma } from "../db/client.js";
import { TaskStatus } from "../generated/prisma/client.js";
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

export interface TaskQueueRecord {
	id: string;
	ticketNumber: number;
	title: string;
	description: string | null;
	status: TaskStatus;
	branchName: string | null;
	worktreePath: string | null;
	project: {
		id: string;
		name: string;
		abbreviation: string;
	};
	metric: {
		epicName: string;
	};
	dependencyIds: string[];
}

export interface TaskQueueOverview {
	activeTasks: TaskQueueRecord[];
	queuedTasks: TaskQueueRecord[];
	blockedTasks: TaskQueueRecord[];
	summary: {
		activeCount: number;
		blockedCount: number;
		queuedCount: number;
	};
}

const queueTaskSelect = {
	id: true,
	ticketNumber: true,
	title: true,
	description: true,
	status: true,
	branchName: true,
	worktreePath: true,
	project: {
		select: {
			id: true,
			name: true,
			abbreviation: true,
		},
	},
	epic: {
		select: {
			name: true,
		},
	},
	dependencies: {
		select: {
			id: true,
		},
	},
} satisfies Prisma.TaskSelect;

const mapQueueTask = (
	task: Prisma.TaskGetPayload<{
		select: typeof queueTaskSelect;
	}>,
): TaskQueueRecord => ({
	id: task.id,
	ticketNumber: task.ticketNumber,
	title: task.title,
	description: task.description,
	status: task.status,
	branchName: task.branchName,
	worktreePath: task.worktreePath,
	project: task.project,
	metric: {
		epicName: task.epic.name,
	},
	dependencyIds: task.dependencies.map((dependency) => dependency.id),
});

export const createTaskRepository = (db: PrismaClient) => ({
	getAll: () => db.task.findMany({ include: taskInclude }),
	getQueueOverview: async (): Promise<TaskQueueOverview> => {
		const tasks = await db.task.findMany({
			where: {
				status: {
					in: [
						TaskStatus.READY_FOR_DEVELOPMENT,
						TaskStatus.IN_DEVELOPMENT,
						TaskStatus.HUMAN_INTERVENTION,
					],
				},
			},
			orderBy: [
				{
					updatedAt: "asc",
				},
				{
					createdAt: "asc",
				},
			],
			select: queueTaskSelect,
		});

		const activeTasks = tasks
			.filter((task) => task.status === TaskStatus.IN_DEVELOPMENT)
			.map(mapQueueTask);
		const queuedTasks = tasks
			.filter((task) => task.status === TaskStatus.READY_FOR_DEVELOPMENT)
			.map(mapQueueTask);
		const blockedTasks = tasks
			.filter((task) => task.status === TaskStatus.HUMAN_INTERVENTION)
			.map(mapQueueTask);

		return {
			activeTasks,
			queuedTasks,
			blockedTasks,
			summary: {
				activeCount: activeTasks.length,
				blockedCount: blockedTasks.length,
				queuedCount: queuedTasks.length,
			},
		};
	},
	getById: (id: string) => db.task.findUnique({ where: { id }, include: taskInclude }),
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
