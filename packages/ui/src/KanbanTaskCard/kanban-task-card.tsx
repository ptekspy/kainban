"use client";

import type { Task } from "@repo/types/Kanban/types";
import type { DragEventHandler } from "react";

interface KanbanTaskCardProps {
	dependencyTaskIds: string[];
	epicName: string;
	task: Task;
	onDragEnd: DragEventHandler<HTMLLIElement>;
	onDragStart: DragEventHandler<HTMLLIElement>;
}

export const KanbanTaskCard = ({
	dependencyTaskIds,
	epicName,
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
			<p className="mb-1 text-xs font-semibold tracking-wide text-slate-500">
				{task.id}
			</p>
			<p className="mb-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
				{epicName}
			</p>
			<h3 className="text-md font-semibold">{task.title}</h3>
			{task.description && (
				<p className="text-sm text-gray-600">{task.description}</p>
			)}
			{dependencyTaskIds.length > 0 ? (
				<p className="mt-2 text-xs text-slate-500">
					Depends on {dependencyTaskIds.join(", ")}
				</p>
			) : (
				<p className="mt-2 text-xs text-slate-500">
					First task in dependency chain
				</p>
			)}
		</li>
	);
};
