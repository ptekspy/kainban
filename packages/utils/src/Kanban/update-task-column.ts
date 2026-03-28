import type { KanbanColumnKey, Task } from "@repo/types/Kanban/types";

export const updateTaskColumn = (
	tasks: Task[],
	taskId: string,
	newColumn: KanbanColumnKey,
) => {
	let hasChanges = false;

	const updatedTasks = tasks.map((task) => {
		if (task.id !== taskId || task.column === newColumn) {
			return task;
		}

		hasChanges = true;

		return {
			...task,
			column: newColumn,
		};
	});

	return hasChanges ? updatedTasks : tasks;
};
