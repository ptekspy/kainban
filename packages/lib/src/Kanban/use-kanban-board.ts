"use client";

import { KANBAN_FLOW } from "@repo/constants/Kanban/board";
import { MOCK_PROJECTS } from "@repo/constants/Kanban/mock-projects";
import type {
	Epic,
	KanbanBoardState,
	KanbanColumnKey,
	Project,
	Task,
} from "@repo/types/Kanban/types";
import { updateTaskColumn } from "@repo/utils/Kanban/update-task-column";
import { type DragEvent, useEffect, useState } from "react";
import { epicSchema } from "../schemas/epic";
import { projectSchema } from "../schemas/project";
import { taskSchema } from "../schemas/task";

const createBoardState = (projects: Project[]): KanbanBoardState => ({
	activeProjectId: projects[0]?.id ?? null,
	projects,
});

export const useKanbanBoard = (initialProjects: Project[] = MOCK_PROJECTS) => {
	const [state, setState] = useState<KanbanBoardState>(() =>
		createBoardState(initialProjects),
	);
	const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
	const [activeDropColumn, setActiveDropColumn] =
		useState<KanbanColumnKey | null>(null);
	const activeProject =
		state.projects.find((project) => project.id === state.activeProjectId) ??
		null;

	useEffect(() => {
		setState((currentState) => ({
			activeProjectId: initialProjects.some(
				(project) => project.id === currentState.activeProjectId,
			)
				? currentState.activeProjectId
				: (initialProjects[0]?.id ?? null),
			projects: initialProjects,
		}));
	}, [initialProjects]);

	const updateActiveProject = (updater: (project: Project) => Project) => {
		if (!activeProject) {
			return;
		}

		setState((currentState) => ({
			...currentState,
			projects: currentState.projects.map((project) =>
				project.id === activeProject.id ? updater(project) : project,
			),
		}));
	};

	const getCountForColumn = (column: KanbanColumnKey) => {
		return (
			activeProject?.tasks.filter((task) => task.column === column).length ?? 0
		);
	};

	const getTasksForColumn = (column: KanbanColumnKey) => {
		return activeProject?.tasks.filter((task) => task.column === column) ?? [];
	};

	const getEpicById = (epicId: string) => {
		return activeProject?.epics.find((epic) => epic.id === epicId) ?? null;
	};

	const getTaskById = (taskId: string) => {
		return activeProject?.tasks.find((task) => task.id === taskId) ?? null;
	};

	const getDependentTasks = (taskId: string) => {
		return (
			activeProject?.tasks.filter((task) =>
				task.dependencyTaskIds.includes(taskId),
			) ?? []
		);
	};

	const createsDependencyCycle = (
		taskId: string,
		dependencyTaskIds: string[],
		project: Project,
	) => {
		const taskMap = new Map(project.tasks.map((task) => [task.id, task]));
		const dependencySet = new Set(dependencyTaskIds);

		const hasPathToTask = (
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
			const task = taskMap.get(startTaskId);

			if (!task) {
				return false;
			}

			const nextDependencyIds =
				startTaskId === taskId ? [...dependencySet] : task.dependencyTaskIds;

			return nextDependencyIds.some((dependencyTaskId) =>
				hasPathToTask(dependencyTaskId, targetTaskId, visited),
			);
		};

		return dependencyTaskIds.some((dependencyTaskId) =>
			hasPathToTask(dependencyTaskId, taskId),
		);
	};

	const areDependenciesInColumn = (
		task: Task,
		column: KanbanColumnKey,
		project: Project,
	) => {
		return task.dependencyTaskIds.every((dependencyTaskId) =>
			project.tasks.some(
				(candidateTask) =>
					candidateTask.id === dependencyTaskId && candidateTask.column === column,
			),
		);
	};

	const releaseBlockedTasks = (project: Project) => {
		return project.tasks.map((task) => {
			if (
				task.column !== "TODO" ||
				task.dependencyTaskIds.length === 0 ||
				!areDependenciesInColumn(task, "RELEASED", project)
			) {
				return task;
			}

			return {
				...task,
				column: "READY_FOR_DEVELOPMENT" as const,
			};
		});
	};

	const getDependencyOptions = (search: string) => {
		const normalizedSearch = search.trim().toLowerCase();
		const taskOptions = activeProject?.tasks ?? [];

		if (normalizedSearch.length === 0) {
			return taskOptions;
		}

		return taskOptions.filter((task) => {
			const epic = getEpicById(task.epicId);
			const searchableText = [
				task.id,
				task.title,
				task.description ?? "",
				epic?.name ?? "",
			]
				.join(" ")
				.toLowerCase();

			return searchableText.includes(normalizedSearch);
		});
	};

	const canMoveTask = (taskId: string, newColumn: KanbanColumnKey) => {
		const currentProject = activeProject;
		if (!currentProject) {
			return false;
		}

		const currentTask = currentProject.tasks.find((task) => task.id === taskId);
		if (!currentTask || currentTask.column === newColumn) {
			return false;
		}

		if (
			newColumn === "READY_FOR_DEVELOPMENT" &&
			!areDependenciesInColumn(currentTask, "IN_RELEASE", currentProject)
		) {
			return false;
		}

		return KANBAN_FLOW[currentTask.column].to.includes(newColumn);
	};

	const getMoveTaskResult = (taskId: string, newColumn: KanbanColumnKey) => {
		const currentProject = activeProject;
		if (!currentProject || !canMoveTask(taskId, newColumn)) {
			return {
				success: false as const,
				reason: "Unable to move the selected task.",
			};
		}

		const nextTasks =
			newColumn === "RELEASED"
				? releaseBlockedTasks({
						...currentProject,
						tasks: updateTaskColumn(currentProject.tasks, taskId, newColumn),
					})
				: updateTaskColumn(currentProject.tasks, taskId, newColumn);
		const changes = nextTasks
			.filter((task) => {
				const currentTask = currentProject.tasks.find(
					(candidateTask) => candidateTask.id === task.id,
				);

				return currentTask?.column !== task.column;
			})
			.map((task) => ({
				taskId: task.id,
				column: task.column,
			}));

		return {
			success: true as const,
			changes,
			tasks: nextTasks,
		};
	};

	const handleMoveTask = (taskId: string, newColumn: KanbanColumnKey) => {
		const moveResult = getMoveTaskResult(taskId, newColumn);

		if (!moveResult.success) {
			return moveResult;
		}

		updateActiveProject((project) => ({
			...project,
			tasks: moveResult.tasks,
		}));

		return moveResult;
	};

	const handleDragStart = (event: DragEvent<HTMLLIElement>, taskId: string) => {
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/task-id", taskId);
		setDraggedTaskId(taskId);
	};

	const handleDragEnd = () => {
		setDraggedTaskId(null);
		setActiveDropColumn(null);
	};

	const handleDragLeave = (column: KanbanColumnKey) => {
		if (activeDropColumn === column) {
			setActiveDropColumn(null);
		}
	};

	const handleDragOver = (
		event: DragEvent<HTMLUListElement>,
		column: KanbanColumnKey,
	) => {
		const taskId = draggedTaskId;
		if (!taskId || !canMoveTask(taskId, column)) {
			return;
		}

		event.preventDefault();
		event.dataTransfer.dropEffect = "move";

		if (activeDropColumn !== column) {
			setActiveDropColumn(column);
		}
	};

	const handleDrop = (
		event: DragEvent<HTMLUListElement>,
		column: KanbanColumnKey,
		onMoveTasks?: (
			changes: Array<{ column: KanbanColumnKey; taskId: string }>,
			project: Project,
		) => Promise<void>,
	) => {
		event.preventDefault();
		const taskId = draggedTaskId ?? event.dataTransfer.getData("text/task-id");
		const currentProject = activeProject;
		const moveResult = getMoveTaskResult(taskId, column);
		setDraggedTaskId(null);
		setActiveDropColumn(null);

		if (!moveResult.success) {
			return;
		}

		if (onMoveTasks && currentProject) {
			void onMoveTasks(moveResult.changes, currentProject).catch(() => {});
			return;
		}

		updateActiveProject((project) => ({
			...project,
			tasks: moveResult.tasks,
		}));
	};

	const handleSelectProject = (projectId: string) => {
		setState((currentState) => ({
			...currentState,
			activeProjectId: projectId,
		}));
		setDraggedTaskId(null);
		setActiveDropColumn(null);
	};

	const handleCreateProject = (input: {
		name: string;
		abbreviation: string;
		githubRepoUrl: string;
	}) => {
		const validation = validateCreateProjectInput(input);

		if (!validation.success) {
			return validation;
		}

		const normalizedProject = validation.data;

		const newProject: Project = {
			id: `project-${normalizedProject.abbreviation.toLowerCase()}`,
			name: normalizedProject.name,
			abbreviation: normalizedProject.abbreviation,
			githubRepoUrl: normalizedProject.githubRepoUrl,
			epics: [],
			tasks: [],
		};

		setState((currentState) => ({
			activeProjectId: newProject.id,
			projects: [...currentState.projects, newProject],
		}));
		setDraggedTaskId(null);
		setActiveDropColumn(null);

		return { success: true as const, project: newProject };
	};

	const handleCreateEpic = (input: { description?: string; name: string }) => {
		if (!activeProject) {
			return { success: false as const, reason: "No active project selected." };
		}

		const validation = validateCreateEpicInput(input);
		if (!validation.success) {
			return validation;
		}

		const normalizedEpic = validation.data;
		const newEpic: Epic = {
			id: `${activeProject.abbreviation.toLowerCase()}-${normalizedEpic.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "")}`,
			name: normalizedEpic.name,
			description: normalizedEpic.description || undefined,
		};

		updateActiveProject((project) => ({
			...project,
			epics: [...project.epics, newEpic],
		}));

		return { success: true as const, epic: newEpic };
	};

	const validateCreateProjectInput = (input: {
		name: string;
		abbreviation: string;
		githubRepoUrl: string;
	}) => {
		const parsed = projectSchema.safeParse(input);

		if (!parsed.success) {
			return {
				success: false as const,
				reason: parsed.error.issues[0]?.message ?? "Project input is invalid.",
			};
		}

		return {
			success: true as const,
			data: parsed.data,
		};
	};

	const validateCreateEpicInput = (input: {
		description?: string;
		name: string;
	}) => {
		const parsed = epicSchema.safeParse(input);

		if (!parsed.success) {
			return {
				success: false as const,
				reason: parsed.error.issues[0]?.message ?? "Epic input is invalid.",
			};
		}

		return {
			success: true as const,
			data: parsed.data,
		};
	};

	const validateCreateTaskInput = (input: {
		dependencyTaskIds: string[];
		description?: string;
		epicId: string;
		title: string;
	}) => {
		if (!activeProject) {
			return { success: false as const, reason: "No active project selected." };
		}

		const parsed = taskSchema.safeParse(input);
		if (!parsed.success) {
			return {
				success: false as const,
				reason: parsed.error.issues[0]?.message ?? "Task input is invalid.",
			};
		}

		const {
			dependencyTaskIds: normalizedDependencyTaskIds,
			epicId,
			title,
		} = parsed.data;
		const epicExists = activeProject.epics.some((epic) => epic.id === epicId);
		const allDependencyTasksExist = normalizedDependencyTaskIds.every(
			(dependencyId) =>
				activeProject.tasks.some((task) => task.id === dependencyId),
		);

		if (!epicExists) {
			return {
				success: false as const,
				reason: "An epic is required for each task.",
			};
		}

		if (
			activeProject.tasks.length > 0 &&
			normalizedDependencyTaskIds.length === 0
		) {
			return {
				success: false as const,
				reason: "Every task after the first one needs at least one dependency.",
			};
		}

		if (!allDependencyTasksExist) {
			return {
				success: false as const,
				reason: "Selected dependencies must exist on the current project.",
			};
		}

		return {
			success: true as const,
			normalizedDependencyTaskIds,
			trimmedDescription: parsed.data.description || undefined,
			trimmedTitle: title,
		};
	};

	const validateUpdateTaskInput = (input: {
		dependencyTaskIds: string[];
		description?: string;
		epicId: string;
		taskId: string;
		title: string;
	}) => {
		if (!activeProject) {
			return { success: false as const, reason: "No active project selected." };
		}

		const currentTask = getTaskById(input.taskId);

		if (!currentTask) {
			return { success: false as const, reason: "Task could not be found." };
		}

		const parsed = taskSchema.safeParse({
			title: input.title,
			description: input.description,
			epicId: input.epicId,
			dependencyTaskIds: input.dependencyTaskIds,
		});

		if (!parsed.success) {
			return {
				success: false as const,
				reason: parsed.error.issues[0]?.message ?? "Task input is invalid.",
			};
		}

		const normalizedDependencyTaskIds = parsed.data.dependencyTaskIds.filter(
			(dependencyTaskId) => dependencyTaskId !== input.taskId,
		);
		const allDependencyTasksExist = normalizedDependencyTaskIds.every(
			(dependencyTaskId) =>
				activeProject.tasks.some((task) => task.id === dependencyTaskId),
		);
		const isExistingRootTask = currentTask.dependencyTaskIds.length === 0;

		if (!allDependencyTasksExist) {
			return {
				success: false as const,
				reason: "Selected dependencies must exist on the current project.",
			};
		}

		if (
			activeProject.tasks.length > 1 &&
			normalizedDependencyTaskIds.length === 0 &&
			!isExistingRootTask
		) {
			return {
				success: false as const,
				reason: "Only the original starting task can remain dependency-free.",
			};
		}

		if (
			normalizedDependencyTaskIds.includes(input.taskId) ||
			createsDependencyCycle(
				input.taskId,
				normalizedDependencyTaskIds,
				activeProject,
			)
		) {
			return {
				success: false as const,
				reason: "That dependency change would create a circular task chain.",
			};
		}

		return {
			success: true as const,
			normalizedDependencyTaskIds,
			trimmedDescription: parsed.data.description || undefined,
			trimmedTitle: parsed.data.title,
		};
	};

	const handleCreateTask = (input: {
		dependencyTaskIds: string[];
		description?: string;
		epicId: string;
		title: string;
	}) => {
		const validation = validateCreateTaskInput(input);

		if (!validation.success) {
			return validation;
		}

		const currentProject = activeProject;
		if (!currentProject) {
			return { success: false as const, reason: "No active project selected." };
		}

		const { normalizedDependencyTaskIds, trimmedDescription, trimmedTitle } =
			validation;
		const newTask: Task = {
			id: `${currentProject.abbreviation}-${currentProject.tasks.length + 1}`,
			sourceId: `${currentProject.abbreviation}-${currentProject.tasks.length + 1}`,
			title: trimmedTitle,
			description: trimmedDescription,
			column: "TODO",
			epicId: input.epicId,
			dependencyTaskIds: normalizedDependencyTaskIds,
		};

		updateActiveProject((project) => ({
			...project,
			tasks: [...project.tasks, newTask],
		}));

		return { success: true as const, task: newTask };
	};

	const handleUpdateTask = (input: {
		dependencyTaskIds: string[];
		description?: string;
		epicId: string;
		taskId: string;
		title: string;
	}) => {
		const validation = validateUpdateTaskInput(input);

		if (!validation.success) {
			return validation;
		}

		updateActiveProject((project) => ({
			...project,
			tasks: project.tasks.map((task) =>
				task.id === input.taskId
					? {
							...task,
							title: validation.trimmedTitle,
							description: validation.trimmedDescription,
							epicId: input.epicId,
							dependencyTaskIds: validation.normalizedDependencyTaskIds,
						}
					: task,
			),
		}));

		return { success: true as const };
	};

	return {
		activeDropColumn,
		activeProject,
		getDependencyOptions,
		getEpicById,
		getTaskById,
		getDependentTasks,
		projects: state.projects,
		getCountForColumn,
		getMoveTaskResult,
		getTasksForColumn,
		handleCreateProject,
		handleCreateEpic,
		handleCreateTask,
		handleUpdateTask,
		handleDragEnd,
		handleDragLeave,
		handleDragOver,
		handleDragStart,
		handleDrop,
		handleMoveTask,
		handleSelectProject,
		validateCreateEpicInput,
		validateCreateProjectInput,
		validateCreateTaskInput,
		validateUpdateTaskInput,
	};
};
