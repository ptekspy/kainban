import type { TaskStatus } from "../generated/prisma/client.js";
import {
	type createTaskRepository,
	type TaskUpdateData,
	taskRepository,
} from "./repository.js";

export interface TaskCreateInput {
	title: string;
	description?: string | null;
	status?: TaskStatus;
	projectId: string;
	epicId: string;
	dependencyIds?: string[];
}

export const createTaskService = (repository: ReturnType<typeof createTaskRepository>) => ({
	getAll: () => repository.getAll(),
	getQueueOverview: () => repository.getQueueOverview(),
	getById: (id: string) => repository.getById(id),
	create: async (data: TaskCreateInput) => {
		const ticketNumber = await repository.getNextTicketNumber(data.projectId);

		return repository.create({
			...data,
			ticketNumber,
		});
	},
	update: (id: string, data: TaskUpdateData) => repository.update(id, data),
	delete: (id: string) => repository.delete(id),
});

export const taskService = createTaskService(taskRepository);
