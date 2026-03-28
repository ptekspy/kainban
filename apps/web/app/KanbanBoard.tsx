"use client";

import { type DragEvent, useState } from "react";
import { twMerge } from "tailwind-merge";
import {
	KANBAN_COLUMN_KEYS,
	KANBAN_COLUMN_SETTINGS,
	KANBAN_COLUMN_TITLES,
	KANBAN_FLOW,
	type KanbanBoardState,
	type KanbanColumnKey,
} from "./constants/Kanban";
import { mockTasks, updateTaskColumn } from "./constants/Tasks";

interface KanbanBoardProps {
	id?: string;
}

export const KanbanBoard = ({ id = "kanban-board" }: KanbanBoardProps) => {
	const [state, setState] = useState<KanbanBoardState>({ tasks: mockTasks });
	const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
	const [activeDropColumn, setActiveDropColumn] =
		useState<KanbanColumnKey | null>(null);

	const getCountForColumn = (column: KanbanColumnKey) => {
		return state.tasks.filter((task) => task.column === column).length;
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

	return (
		<section id={id}>
			<h1 className="mb-4 text-2xl font-bold">Kanban Board</h1>
			<p className="text-gray-600">
				This is where the Kanban board will be displayed.
			</p>
			<div className="flex gap-4 overflow-x-auto">
				{KANBAN_COLUMN_KEYS.map((columnKey) => {
					const title = KANBAN_COLUMN_TITLES[columnKey];
					const columnSettings = KANBAN_COLUMN_SETTINGS[columnKey];

					return (
						<div
							key={columnKey}
							className={twMerge(
								"min-h-75 min-w-80 flex-1 list-none rounded-lg border-2 border-transparent p-4 transition-colors",
								columnSettings.backgroundColor,
								activeDropColumn === columnKey && "border-slate-500",
							)}
						>
							<div className="flex items-center justify-between">
								<h2 className="whitespace-nowrap text-lg font-semibold">
									{title}
								</h2>
								<span className="text-sm text-gray-500">
									{getCountForColumn(columnKey)} tasks
								</span>
							</div>
							<ul
								aria-label={`${title} tasks`}
								onDragOver={(event) => handleDragOver(event, columnKey)}
								onDragLeave={() => {
									if (activeDropColumn === columnKey) {
										setActiveDropColumn(null);
									}
								}}
								onDrop={(event) => handleDrop(event, columnKey)}
								className="mt-2 min-h-48 list-none"
							>
								{state.tasks
									.filter((task) => task.column === columnKey)
									.map((task) => (
										<li
											key={task.id}
											aria-roledescription="Draggable task"
											draggable
											onDragStart={(event) => handleDragStart(event, task.id)}
											onDragEnd={handleDragEnd}
											className="mb-2 cursor-grab rounded bg-white p-2 shadow active:cursor-grabbing"
										>
											<h3 className="text-md font-semibold">{task.title}</h3>
											{task.description && (
												<p className="text-sm text-gray-600">
													{task.description}
												</p>
											)}
										</li>
									))}
							</ul>
						</div>
					);
				})}
			</div>
		</section>
	);
};
