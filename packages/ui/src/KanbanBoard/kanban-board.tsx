"use client";

import {
	KANBAN_COLUMN_KEYS,
	KANBAN_COLUMN_SETTINGS,
	KANBAN_COLUMN_TITLES,
} from "@repo/constants/Kanban/board";
import { useKanbanBoard } from "@repo/lib/Kanban/use-kanban-board";
import { KanbanColumn } from "../KanbanColumn/kanban-column";
import { KanbanTaskCard } from "../KanbanTaskCard/kanban-task-card";

interface KanbanBoardProps {
	id?: string;
}

export const KanbanBoard = ({ id = "kanban-board" }: KanbanBoardProps) => {
	const {
		activeDropColumn,
		getCountForColumn,
		getTasksForColumn,
		handleDragEnd,
		handleDragLeave,
		handleDragOver,
		handleDragStart,
		handleDrop,
	} = useKanbanBoard();

	return (
		<section id={id}>
			<h1 className="mb-4 text-2xl font-bold">Kanban Board</h1>
			<p className="text-gray-600">
				This is where the Kanban board will be displayed.
			</p>
			<div className="flex gap-4 overflow-x-auto">
				{KANBAN_COLUMN_KEYS.map((columnKey) => (
					<KanbanColumn
						key={columnKey}
						backgroundColor={KANBAN_COLUMN_SETTINGS[columnKey].backgroundColor}
						isActiveDropColumn={activeDropColumn === columnKey}
						onDragLeave={() => handleDragLeave(columnKey)}
						onDragOver={(event) => handleDragOver(event, columnKey)}
						onDrop={(event) => handleDrop(event, columnKey)}
						taskCount={getCountForColumn(columnKey)}
						title={KANBAN_COLUMN_TITLES[columnKey]}
					>
						{getTasksForColumn(columnKey).map((task) => (
							<KanbanTaskCard
								key={task.id}
								task={task}
								onDragStart={(event) => handleDragStart(event, task.id)}
								onDragEnd={handleDragEnd}
							/>
						))}
					</KanbanColumn>
				))}
			</div>
		</section>
	);
};
