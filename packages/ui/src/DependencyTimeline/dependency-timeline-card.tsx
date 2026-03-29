"use client";

import {
	getTimelineStatusTone,
	type TimelineTask,
} from "@repo/lib/Kanban/get-project-timeline";

interface DependencyTimelineCardProps {
	isDimmed?: boolean;
	isDownstream?: boolean;
	isSelected?: boolean;
	isUpstream?: boolean;
	onOpenDetails?: () => void;
	onSelect?: () => void;
	task: TimelineTask;
}

export const DependencyTimelineCard = ({
	isDimmed = false,
	isDownstream = false,
	isSelected = false,
	isUpstream = false,
	onOpenDetails,
	onSelect,
	task,
}: DependencyTimelineCardProps) => {
	return (
		<li>
			<button
				type="button"
				aria-pressed={isSelected}
				onClick={onSelect}
				className={`min-h-[13.75rem] w-full rounded-3xl border p-4 text-left shadow-sm transition ${
					isSelected
						? "border-cyan-400 bg-cyan-50 shadow-[0_10px_30px_rgba(8,145,178,0.16)]"
						: isUpstream
							? "border-amber-300 bg-amber-50"
							: isDownstream
								? "border-emerald-300 bg-emerald-50"
								: "border-slate-200 bg-white"
				} ${isDimmed ? "opacity-45" : "opacity-100 hover:border-slate-300"}`}
			>
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-xs font-semibold tracking-[0.18em] text-slate-500">
							{task.id}
						</p>
						<h3 className="mt-2 text-lg font-semibold text-slate-950">
							{task.title}
						</h3>
					</div>
					<span
						className={`rounded-full px-2 py-1 text-xs font-semibold ${getTimelineStatusTone(
							task.column,
						)}`}
					>
						{task.column.replaceAll("_", " ")}
					</span>
				</div>
				<div className="mt-3 flex flex-wrap gap-2">
					{onOpenDetails ? (
						<button
							type="button"
							onClick={(event) => {
								event.stopPropagation();
								onOpenDetails();
							}}
							className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
						>
							Details
						</button>
					) : null}
					{isSelected ? (
						<span className="rounded-full bg-cyan-200 px-2 py-1 text-xs font-semibold text-cyan-900">
							Selected task
						</span>
					) : null}
					{isUpstream ? (
						<span className="rounded-full bg-amber-200 px-2 py-1 text-xs font-semibold text-amber-900">
							Dependency
						</span>
					) : null}
					{isDownstream ? (
						<span className="rounded-full bg-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-900">
							Dependent
						</span>
					) : null}
				</div>
				{task.description ? (
					<p className="mt-3 text-sm leading-6 text-slate-600">
						{task.description}
					</p>
				) : null}
				<div className="mt-4 space-y-2 text-xs text-slate-500">
					<p>
						{task.dependencyTaskIds.length > 0
							? `Depends on ${task.dependencyTaskIds.join(", ")}`
							: "Starting point in the dependency chain"}
					</p>
					{task.dependentTaskIds.length > 0 ? (
						<p>Unlocks {task.dependentTaskIds.join(", ")}</p>
					) : (
						<p>No downstream tasks yet</p>
					)}
				</div>
			</button>
		</li>
	);
};
