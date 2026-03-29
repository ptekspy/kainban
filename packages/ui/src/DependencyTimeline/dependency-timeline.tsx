"use client";

import {
	getProjectTimeline,
	type TimelineColumn,
} from "@repo/lib/Kanban/get-project-timeline";
import type { Project } from "@repo/types/Kanban/types";
import { useMemo, useState } from "react";
import { DependencyTimelineCard } from "./dependency-timeline-card";
import { getConnectionPath } from "./get-connection-path";

interface DependencyTimelineProps {
	onOpenTaskDetails?: (taskId: string) => void;
	project: Project | null;
}

interface TimelineConnection {
	fromTaskId: string;
	isDownstream: boolean;
	isHighlighted: boolean;
	isUpstream: boolean;
	path: string;
	toTaskId: string;
}

const TIMELINE_COLUMN_WIDTH = 320;
const TIMELINE_COLUMN_GAP = 16;
const TIMELINE_COLUMN_PADDING = 16;
const TIMELINE_CARD_HEIGHT = 220;
const TIMELINE_ROW_GAP = 16;
const TIMELINE_HEADER_HEIGHT = 94;

const collectRelatedTaskIds = (
	taskId: string,
	taskMap: Map<string, { dependencyTaskIds: string[]; dependentTaskIds: string[] }>,
	direction: "dependencies" | "dependents",
) => {
	const relationKey =
		direction === "dependencies" ? "dependencyTaskIds" : "dependentTaskIds";
	const visited = new Set<string>();
	const stack = [...(taskMap.get(taskId)?.[relationKey] ?? [])];

	while (stack.length > 0) {
		const currentTaskId = stack.pop();

		if (!currentTaskId || visited.has(currentTaskId)) {
			continue;
		}

		visited.add(currentTaskId);

		for (const relationTaskId of taskMap.get(currentTaskId)?.[relationKey] ?? []) {
			if (!visited.has(relationTaskId)) {
				stack.push(relationTaskId);
			}
		}
	}

	return visited;
};

const EmptyTimeline = () => (
	<div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
		<h3 className="text-lg font-semibold text-slate-900">No project selected</h3>
		<p className="mt-2 text-sm text-slate-600">
			Pick a project to explore the dependency chain.
		</p>
	</div>
);

const EmptyTimelineProject = () => (
	<div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
		<h3 className="text-lg font-semibold text-slate-900">No tasks yet</h3>
		<p className="mt-2 text-sm text-slate-600">
			The timeline appears once tasks exist and can be arranged by dependency
			depth.
		</p>
	</div>
);

const TimelineColumnSection = ({
	column,
	downstreamTaskIds,
	onOpenTaskDetails,
	onSelectTask,
	selectedTaskId,
	upstreamTaskIds,
}: {
	column: TimelineColumn;
	downstreamTaskIds: Set<string>;
	onSelectTask: (taskId: string) => void;
	onOpenTaskDetails?: (taskId: string) => void;
	selectedTaskId: string | null;
	upstreamTaskIds: Set<string>;
}) => (
	<section
		aria-label={`${column.title} timeline column`}
		className="w-[20rem] shrink-0 rounded-[2rem] border border-slate-200 bg-slate-50/80 p-4"
	>
		<div className="border-b border-slate-200 pb-3">
			<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
				Level {column.depth + 1}
			</p>
			<h3 className="mt-2 text-lg font-semibold text-slate-950">
				{column.title}
			</h3>
			<p className="mt-1 text-sm text-slate-500">
				{column.tasks.length} task{column.tasks.length === 1 ? "" : "s"}
			</p>
		</div>
		<ul className="mt-4 space-y-4">
			{column.tasks.map((task) => (
				<DependencyTimelineCard
					key={task.id}
					task={task}
					isSelected={selectedTaskId === task.id}
					isUpstream={upstreamTaskIds.has(task.id)}
					isDownstream={downstreamTaskIds.has(task.id)}
					isDimmed={
						selectedTaskId !== null &&
						selectedTaskId !== task.id &&
						!upstreamTaskIds.has(task.id) &&
						!downstreamTaskIds.has(task.id)
					}
					onOpenDetails={
						onOpenTaskDetails
							? () => onOpenTaskDetails(task.id)
							: undefined
					}
					onSelect={() => onSelectTask(task.id)}
				/>
			))}
		</ul>
	</section>
);

const getConnectionTone = (connection: TimelineConnection) => {
	if (connection.isHighlighted) {
		return "stroke-cyan-500";
	}

	if (connection.isUpstream) {
		return "stroke-amber-400";
	}

	if (connection.isDownstream) {
		return "stroke-emerald-400";
	}

	return "stroke-slate-300";
};

export const DependencyTimeline = ({
	onOpenTaskDetails,
	project,
}: DependencyTimelineProps) => {
	const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

	if (!project) {
		return <EmptyTimeline />;
	}

	if (project.tasks.length === 0) {
		return <EmptyTimelineProject />;
	}

	const columns = getProjectTimeline(project);
	const taskMap = useMemo(
		() =>
			new Map(
				columns.flatMap((column) =>
					column.tasks.map((task) => [
						task.id,
						{
							dependencyTaskIds: task.dependencyTaskIds,
							dependentTaskIds: task.dependentTaskIds,
						},
					]),
				),
			),
		[columns],
	);
	const upstreamTaskIds = useMemo(() => {
		if (!selectedTaskId) {
			return new Set<string>();
		}

		return collectRelatedTaskIds(selectedTaskId, taskMap, "dependencies");
	}, [selectedTaskId, taskMap]);
	const downstreamTaskIds = useMemo(() => {
		if (!selectedTaskId) {
			return new Set<string>();
		}

		return collectRelatedTaskIds(selectedTaskId, taskMap, "dependents");
	}, [selectedTaskId, taskMap]);
	const connections = useMemo(() => {
		const positions = new Map<string, { columnIndex: number; rowIndex: number }>();

		for (const [columnIndex, column] of columns.entries()) {
			for (const [rowIndex, task] of column.tasks.entries()) {
				positions.set(task.id, {
					columnIndex,
					rowIndex,
				});
			}
		}

		return columns.flatMap((column) =>
			column.tasks.flatMap((task) => {
				const toPosition = positions.get(task.id);
				if (!toPosition) {
					return [];
				}

				return task.dependencyTaskIds.flatMap((dependencyTaskId) => {
					const fromPosition = positions.get(dependencyTaskId);
					if (!fromPosition) {
						return [];
					}
					const dependencyIndex = task.dependencyTaskIds.indexOf(
						dependencyTaskId,
					);

					const isUpstream =
						selectedTaskId === task.id || upstreamTaskIds.has(dependencyTaskId);
					const isDownstream =
						selectedTaskId === dependencyTaskId ||
						downstreamTaskIds.has(task.id);

					return [
						{
							fromTaskId: dependencyTaskId,
							toTaskId: task.id,
							path: getConnectionPath({
								columnGap: TIMELINE_COLUMN_GAP,
								columnPadding: TIMELINE_COLUMN_PADDING,
								columnWidth: TIMELINE_COLUMN_WIDTH,
								dependencyIndex,
								dependencyTotal: task.dependencyTaskIds.length,
								fromColumnIndex: fromPosition.columnIndex,
								fromRowIndex: fromPosition.rowIndex,
								headerHeight: TIMELINE_HEADER_HEIGHT,
								rowGap: TIMELINE_ROW_GAP,
								rowHeight: TIMELINE_CARD_HEIGHT,
								toColumnIndex: toPosition.columnIndex,
								toRowIndex: toPosition.rowIndex,
							}),
							isUpstream,
							isDownstream,
							isHighlighted:
								selectedTaskId !== null &&
								(selectedTaskId === dependencyTaskId ||
									selectedTaskId === task.id ||
									(upstreamTaskIds.has(dependencyTaskId) &&
										(selectedTaskId === task.id || upstreamTaskIds.has(task.id))) ||
									(downstreamTaskIds.has(task.id) &&
										(selectedTaskId === dependencyTaskId ||
											downstreamTaskIds.has(dependencyTaskId)))),
						} satisfies TimelineConnection,
					];
				});
			}),
		);
	}, [columns, downstreamTaskIds, selectedTaskId, upstreamTaskIds]);
	const svgHeight =
		TIMELINE_HEADER_HEIGHT +
		Math.max(...columns.map((column) => column.tasks.length), 1) * TIMELINE_CARD_HEIGHT +
		Math.max(...columns.map((column) => column.tasks.length - 1), 0) *
			TIMELINE_ROW_GAP;
	const svgWidth =
		columns.length * TIMELINE_COLUMN_WIDTH +
		Math.max(columns.length - 1, 0) * TIMELINE_COLUMN_GAP;

	return (
		<div className="space-y-4">
			<div>
				<p className="text-sm uppercase tracking-[0.24em] text-cyan-700">
					Dependency Timeline
				</p>
				<h2 className="mt-2 text-2xl font-semibold text-slate-950">
					Task flow by dependency depth
				</h2>
				<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
					This view ignores calendar time and shows how work unlocks as
					dependencies are completed.
				</p>
				<p className="mt-2 text-sm text-slate-500">
					Select a task to highlight its dependency chain.
				</p>
			</div>
			<div className="overflow-x-auto pb-2">
				<div
					className="relative"
					style={{
						height: `${svgHeight}px`,
						width: `${svgWidth}px`,
					}}
				>
					<svg
						aria-label="Dependency flow connections"
						className="pointer-events-none absolute inset-0"
						viewBox={`0 0 ${svgWidth} ${svgHeight}`}
						fill="none"
					>
						<title>Dependency flow connections</title>
						{connections.map((connection) => (
							<path
								key={`${connection.fromTaskId}-${connection.toTaskId}`}
								d={connection.path}
								className={`${getConnectionTone(connection)} transition`}
								strokeWidth={connection.isHighlighted ? 3.5 : 2}
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeDasharray={connection.isHighlighted ? "0" : "6 6"}
							/>
						))}
					</svg>
					<div className="absolute inset-0 flex min-w-max gap-4">
						{columns.map((column) => (
							<TimelineColumnSection
								key={column.depth}
								column={column}
								selectedTaskId={selectedTaskId}
								upstreamTaskIds={upstreamTaskIds}
								downstreamTaskIds={downstreamTaskIds}
								onOpenTaskDetails={onOpenTaskDetails}
								onSelectTask={(taskId) =>
									setSelectedTaskId((currentTaskId) =>
										currentTaskId === taskId ? null : taskId,
									)
								}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
