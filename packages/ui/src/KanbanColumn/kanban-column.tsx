"use client";

import type { DragEventHandler, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface KanbanColumnProps {
	backgroundColor: string;
	children: ReactNode;
	isActiveDropColumn: boolean;
	onDragLeave: DragEventHandler<HTMLUListElement>;
	onDragOver: DragEventHandler<HTMLUListElement>;
	onDrop: DragEventHandler<HTMLUListElement>;
	taskCount: number;
	title: string;
}

export const KanbanColumn = ({
	backgroundColor,
	children,
	isActiveDropColumn,
	onDragLeave,
	onDragOver,
	onDrop,
	taskCount,
	title,
}: KanbanColumnProps) => {
	return (
		<div
			className={twMerge(
				"min-h-75 min-w-80 flex-1 rounded-lg border-2 border-transparent p-4 transition-colors",
				backgroundColor,
				isActiveDropColumn && "border-slate-500",
			)}
		>
			<div className="flex items-center justify-between">
				<h2 className="whitespace-nowrap text-lg font-semibold">{title}</h2>
				<span className="text-sm text-gray-500">{taskCount} tasks</span>
			</div>
			<ul
				aria-label={`${title} tasks`}
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				className="mt-2 min-h-48 list-none"
			>
				{children}
			</ul>
		</div>
	);
};
