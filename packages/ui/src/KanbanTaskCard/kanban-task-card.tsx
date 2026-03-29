"use client";

import type { Task } from "@repo/types/Kanban/types";
import type { DragEventHandler } from "react";

interface KanbanTaskCardProps {
	dependencyTaskIds: string[];
	epicName: string;
	onOpenDetails?: () => void;
	task: Task;
	onDragEnd: DragEventHandler<HTMLLIElement>;
	onDragStart: DragEventHandler<HTMLLIElement>;
}

export const KanbanTaskCard = ({
	dependencyTaskIds,
	epicName,
	onOpenDetails,
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
			{onOpenDetails ? (
				<div className="mb-2">
					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							onOpenDetails();
						}}
						className="rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
					>
						Details
					</button>
				</div>
			) : null}
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
