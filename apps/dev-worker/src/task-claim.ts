export interface ClaimedTask {
	id: string;
	projectAbbreviation: string;
	projectId: string;
	projectName: string;
	githubRepoUrl: string;
	ticketNumber: number;
	title: string;
	description: string | null;
}

export interface TaskClaimRepository {
	claimNextReadyTask: () => Promise<ClaimedTask | null>;
	assignTaskWorkspace: (
		taskId: string,
		assignment: {
			branchName: string;
			worktreePath: string;
		},
	) => Promise<void>;
	returnTaskToReadyForDevelopment: (taskId: string) => Promise<void>;
}

export const createTaskClaimService = (repository: TaskClaimRepository) => {
	let activeTask: ClaimedTask | null = null;

	return {
		claimNextTask: async () => {
			if (activeTask) {
				return activeTask;
			}

			const claimedTask = await repository.claimNextReadyTask();

			if (claimedTask) {
				activeTask = claimedTask;
			}

			return claimedTask;
		},
		getActiveTask: () => activeTask,
		requeueActiveTask: async () => {
			if (!activeTask) {
				return;
			}

			const { id } = activeTask;
			activeTask = null;
			await repository.returnTaskToReadyForDevelopment(id);
		},
		releaseActiveTask: () => {
			activeTask = null;
		},
	};
};