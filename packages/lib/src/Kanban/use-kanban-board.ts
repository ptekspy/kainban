"use client";

import { KANBAN_FLOW } from "@repo/constants/Kanban/board";
import { MOCK_PROJECTS } from "@repo/constants/Kanban/mock-projects";
import type {
	KanbanBoardState,
	KanbanColumnKey,
	Project,
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
			tasks: [],
		};

		setState((currentState) => ({
			activeProjectId: newProject.id,
			projects: [...currentState.projects, newProject],
		}));
		setDraggedTaskId(null);
		setActiveDropColumn(null);
	};

	return {
		activeDropColumn,
		activeProject,
		projects: state.projects,
		getCountForColumn,
		getTasksForColumn,
		handleCreateProject,
		handleDragEnd,
		handleDragLeave,
		handleDragOver,
		handleDragStart,
		handleDrop,
		handleMoveTask,
		handleSelectProject,
	};
};
