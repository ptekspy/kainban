"use client";

import type { Task } from "@repo/types/Kanban/types";
import type { DragEventHandler } from "react";

interface KanbanTaskCardProps {
	task: Task;
	onDragEnd: DragEventHandler<HTMLLIElement>;
	onDragStart: DragEventHandler<HTMLLIElement>;
}

export const KanbanTaskCard = ({
	task,
	onDragEnd,
	onDragStart,
}: KanbanTaskCardProps) => {
	return (
		<li
			aria-roledescription="Draggable task"
			draggable
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			className="mb-2 cursor-grab rounded bg-white p-2 shadow active:cursor-grabbing"
		>
			<h3 className="text-md font-semibold">{task.title}</h3>
			{task.description && (
				<p className="text-sm text-gray-600">{task.description}</p>
			)}
		</li>
	);
};
