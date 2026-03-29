"use client";

interface EpicListItem {
	description?: string;
	id: string;
	name: string;
	taskCount: number;
}

interface EpicListProps {
	epics: EpicListItem[];
}

export const EpicList = ({ epics }: EpicListProps) => {
	if (epics.length === 0) {
		return (
			<div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
				Create an epic before adding tasks to this project.
			</div>
		);
	}

	return (
		<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
			{epics.map((epic) => (
				<div
					key={epic.id}
					className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
				>
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className="text-sm font-semibold text-slate-950">
								{epic.name}
							</p>
							<p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
								{epic.id}
							</p>
						</div>
						<span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700">
							{epic.taskCount} tasks
						</span>
					</div>
					{epic.description ? (
						<p className="mt-3 text-sm text-slate-600">{epic.description}</p>
					) : null}
				</div>
			))}
		</div>
	);
};
