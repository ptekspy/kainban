"use client";

import { KANBAN_FLOW } from "@repo/constants/Kanban/board";
import { MOCK_TASKS } from "@repo/constants/Kanban/mock-tasks";
import type {
	KanbanBoardState,
	KanbanColumnKey,
} from "@repo/types/Kanban/types";
import { updateTaskColumn } from "@repo/utils/Kanban/update-task-column";
import { type DragEvent, useState } from "react";

export const useKanbanBoard = () => {
	const [state, setState] = useState<KanbanBoardState>({ tasks: MOCK_TASKS });
	const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
	const [activeDropColumn, setActiveDropColumn] =
		useState<KanbanColumnKey | null>(null);

	const getCountForColumn = (column: KanbanColumnKey) => {
		return state.tasks.filter((task) => task.column === column).length;
	};

	const getTasksForColumn = (column: KanbanColumnKey) => {
		return state.tasks.filter((task) => task.column === column);
	};

	const canMoveTask = (taskId: string, newColumn: KanbanColumnKey) => {
		const currentTask = state.tasks.find((task) => task.id === taskId);
		if (!currentTask || currentTask.column === newColumn) {
			return false;
		}

		return KANBAN_FLOW[currentTask.column].to.includes(newColumn);
	};

	const handleMoveTask = (taskId: string, newColumn: KanbanColumnKey) => {
		if (!canMoveTask(taskId, newColumn)) {
			return;
		}

		setState((currentState) => ({
			tasks: updateTaskColumn(currentState.tasks, taskId, newColumn),
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

	return {
		activeDropColumn,
		getCountForColumn,
		getTasksForColumn,
		handleDragEnd,
		handleDragLeave,
		handleDragOver,
		handleDragStart,
		handleDrop,
		handleMoveTask,
	};
};
