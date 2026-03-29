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
import { type DragEvent, useState } from "react";

export const useKanbanBoard = () => {
	const [state, setState] = useState<KanbanBoardState>({
		activeProjectId: MOCK_PROJECTS[0]?.id ?? null,
		projects: MOCK_PROJECTS,
	});
	const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
	const [activeDropColumn, setActiveDropColumn] =
		useState<KanbanColumnKey | null>(null);
	const activeProject =
		state.projects.find((project) => project.id === state.activeProjectId) ??
		null;

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
		const currentTask = activeProject?.tasks.find((task) => task.id === taskId);
		if (!currentTask || currentTask.column === newColumn) {
			return false;
		}

		return KANBAN_FLOW[currentTask.column].to.includes(newColumn);
	};

	const handleMoveTask = (taskId: string, newColumn: KanbanColumnKey) => {
		if (!canMoveTask(taskId, newColumn)) {
			return;
		}

		updateActiveProject((project) => ({
			...project,
			tasks: updateTaskColumn(project.tasks, taskId, newColumn),
		}));
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
	) => {
		event.preventDefault();
		const taskId = draggedTaskId ?? event.dataTransfer.getData("text/task-id");

		handleMoveTask(taskId, column);
		setDraggedTaskId(null);
		setActiveDropColumn(null);
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
		const normalizedAbbreviation = input.abbreviation
			.trim()
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, "");

		const newProject: Project = {
			id: `project-${normalizedAbbreviation.toLowerCase()}`,
			name: input.name.trim(),
			abbreviation: normalizedAbbreviation,
			githubRepoUrl: input.githubRepoUrl.trim(),
			epics: [],
			tasks: [],
		};

		setState((currentState) => ({
			activeProjectId: newProject.id,
			projects: [...currentState.projects, newProject],
		}));
		setDraggedTaskId(null);
		setActiveDropColumn(null);
	};

	const handleCreateEpic = (input: { description?: string; name: string }) => {
		if (!activeProject) {
			return;
		}

		const normalizedName = input.name.trim();
		if (normalizedName.length === 0) {
			return;
		}

		const newEpic: Epic = {
			id: `${activeProject.abbreviation.toLowerCase()}-${normalizedName
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, "")}`,
			name: normalizedName,
			description: input.description?.trim() || undefined,
		};

		updateActiveProject((project) => ({
			...project,
			epics: [...project.epics, newEpic],
		}));
	};

	const handleCreateTask = (input: {
		dependencyTaskIds: string[];
		description?: string;
		epicId: string;
		title: string;
	}) => {
		if (!activeProject) {
			return { success: false as const, reason: "No active project selected." };
		}

		const trimmedTitle = input.title.trim();
		const normalizedDependencyTaskIds = [...new Set(input.dependencyTaskIds)];
		const epicExists = activeProject.epics.some(
			(epic) => epic.id === input.epicId,
		);
		const allDependencyTasksExist = normalizedDependencyTaskIds.every(
			(dependencyId) =>
				activeProject.tasks.some((task) => task.id === dependencyId),
		);

		if (trimmedTitle.length === 0) {
			return { success: false as const, reason: "Task title is required." };
		}

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

		const newTask: Task = {
			id: `${activeProject.abbreviation}-${activeProject.tasks.length + 1}`,
			title: trimmedTitle,
			description: input.description?.trim() || undefined,
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

	return {
		activeDropColumn,
		activeProject,
		getDependencyOptions,
		getEpicById,
		getTaskById,
		projects: state.projects,
		getCountForColumn,
		getTasksForColumn,
		handleCreateProject,
		handleCreateEpic,
		handleCreateTask,
		handleDragEnd,
		handleDragLeave,
		handleDragOver,
		handleDragStart,
		handleDrop,
		handleMoveTask,
		handleSelectProject,
	};
};
