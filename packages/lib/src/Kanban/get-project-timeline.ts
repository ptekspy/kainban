import type { KanbanColumnKey, Project, Task } from "@repo/types/Kanban/types";

export interface TimelineTask extends Task {
	depth: number;
	dependentTaskIds: string[];
}

export interface TimelineColumn {
	depth: number;
	tasks: TimelineTask[];
	title: string;
}

const getDepthLabel = (depth: number) => {
	if (depth === 0) {
		return "Starting tasks";
	}

	if (depth === 1) {
		return "Depends on 1 step";
	}

	return `Depends on ${depth} steps`;
};

const sortTasks = (left: Task, right: Task) => {
	return left.id.localeCompare(right.id);
};

export const getProjectTimeline = (project: Project): TimelineColumn[] => {
	const taskMap = new Map(project.tasks.map((task) => [task.id, task]));
	const memoizedDepth = new Map<string, number>();
	const dependentTaskIds = new Map<string, string[]>();

	for (const task of project.tasks) {
		dependentTaskIds.set(task.id, []);
	}

	for (const task of project.tasks) {
		for (const dependencyTaskId of task.dependencyTaskIds) {
			const dependents = dependentTaskIds.get(dependencyTaskId);

			if (!dependents) {
				continue;
			}

			dependents.push(task.id);
		}
	}

	const getTaskDepth = (taskId: string, path: Set<string>): number => {
		const memoizedValue = memoizedDepth.get(taskId);
		if (memoizedValue !== undefined) {
			return memoizedValue;
		}

		const task = taskMap.get(taskId);
		if (!task) {
			return 0;
		}

		if (path.has(taskId)) {
			return 0;
		}

		if (task.dependencyTaskIds.length === 0) {
			memoizedDepth.set(taskId, 0);
			return 0;
		}

		const nextPath = new Set(path);
		nextPath.add(taskId);
		const dependencyDepths = task.dependencyTaskIds
			.map((dependencyTaskId) =>
				taskMap.has(dependencyTaskId)
					? getTaskDepth(dependencyTaskId, nextPath)
					: 0,
			)
			.filter((depth) => Number.isFinite(depth));
		const nextDepth =
			dependencyDepths.length > 0 ? Math.max(...dependencyDepths) + 1 : 0;

		memoizedDepth.set(taskId, nextDepth);
		return nextDepth;
	};

	const columns = new Map<number, TimelineTask[]>();

	for (const task of [...project.tasks].sort(sortTasks)) {
		const depth = getTaskDepth(task.id, new Set<string>());
		const timelineTask: TimelineTask = {
			...task,
			depth,
			dependentTaskIds: [...(dependentTaskIds.get(task.id) ?? [])].sort(),
		};
		const existingColumnTasks = columns.get(depth) ?? [];
		existingColumnTasks.push(timelineTask);
		columns.set(depth, existingColumnTasks);
	}

	return [...columns.entries()]
		.sort(([leftDepth], [rightDepth]) => leftDepth - rightDepth)
		.map(([depth, tasks]) => ({
			depth,
			title: getDepthLabel(depth),
			tasks: tasks.sort(sortTasks),
		}));
};

export const getTimelineStatusTone = (column: KanbanColumnKey) => {
	switch (column) {
		case "TODO":
			return "bg-slate-200 text-slate-700";
		case "READY_FOR_DEVELOPMENT":
			return "bg-cyan-100 text-cyan-800";
		case "IN_DEVELOPMENT":
			return "bg-blue-100 text-blue-800";
		case "READY_FOR_REVIEW":
			return "bg-violet-100 text-violet-800";
		case "IN_REVIEW":
			return "bg-fuchsia-100 text-fuchsia-800";
		case "READY_FOR_RELEASE":
			return "bg-amber-100 text-amber-800";
		case "IN_RELEASE":
			return "bg-orange-100 text-orange-800";
		case "HUMAN_INTERVENTION":
			return "bg-rose-100 text-rose-800";
		case "RELEASED":
			return "bg-emerald-100 text-emerald-800";
	}
};
