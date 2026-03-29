import type { TaskStatus } from "../generated/prisma/client.js";
import {
	type createTaskRepository,
	type TaskDependencyGraphNode,
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

export class TaskDependencyValidationError extends Error {
	code: string;
	status: number;

	constructor(message: string, code: string, status = 409) {
		super(message);
		this.name = "TaskDependencyValidationError";
		this.code = code;
		this.status = status;
	}
}

const hasPathToTask = (
	graph: Map<string, TaskDependencyGraphNode>,
	startTaskId: string,
	targetTaskId: string,
	visited = new Set<string>(),
): boolean => {
	if (startTaskId === targetTaskId) {
		return true;
	}

	if (visited.has(startTaskId)) {
		return false;
	}

	visited.add(startTaskId);
	const task = graph.get(startTaskId);

	if (!task) {
		return false;
	}

	return task.dependencyIds.some((dependencyId) =>
		hasPathToTask(graph, dependencyId, targetTaskId, visited),
	);
};

export const createTaskService = (repository: ReturnType<typeof createTaskRepository>) => {
	const validateDependencies = async (input: {
		dependencyIds?: string[];
		projectId: string;
		taskId?: string;
	}) => {
		const dependencyIds = [...new Set(input.dependencyIds ?? [])];

		if (input.taskId && dependencyIds.includes(input.taskId)) {
			throw new TaskDependencyValidationError(
				"A task cannot depend on itself.",
				"TASK_SELF_DEPENDENCY",
			);
		}

		if (dependencyIds.length === 0) {
			return;
		}

		const graphNodes = await repository.getDependencyGraphByProject(input.projectId);
		const graph = new Map(graphNodes.map((task) => [task.id, task]));
		const allDependencyTasksExist = dependencyIds.every((dependencyId) =>
			graph.has(dependencyId),
		);

		if (!allDependencyTasksExist) {
			throw new TaskDependencyValidationError(
				"Dependencies must belong to the current project.",
				"TASK_INVALID_DEPENDENCY",
			);
		}

		if (!input.taskId) {
			return;
		}

		for (const dependencyId of dependencyIds) {
			if (hasPathToTask(graph, dependencyId, input.taskId)) {
				throw new TaskDependencyValidationError(
					"That dependency change would create a circular task chain.",
					"TASK_DEPENDENCY_CYCLE",
				);
			}
		}
	};

	return {
	getAll: () => repository.getAll(),
	getById: (id: string) => repository.getById(id),
	create: async (data: TaskCreateInput) => {
		await validateDependencies({
			projectId: data.projectId,
			dependencyIds: data.dependencyIds,
		});
		const ticketNumber = await repository.getNextTicketNumber(data.projectId);

		return repository.create({
			...data,
			ticketNumber,
		});
	},
	update: async (id: string, data: TaskUpdateData) => {
		const existingTask = await repository.getById(id);

		if (!existingTask) {
			return null;
		}

		await validateDependencies({
			taskId: id,
			projectId: data.projectId ?? existingTask.projectId,
			dependencyIds: data.dependencyIds,
		});

		return repository.update(id, data);
	},
	delete: (id: string) => repository.delete(id),
	};
};

export const taskService = createTaskService(taskRepository);
