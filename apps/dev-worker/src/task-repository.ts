import type { Pool } from "pg";
import type { ClaimedTask, TaskClaimRepository } from "./task-claim.js";

interface ClaimedTaskRow {
	id: string;
	projectAbbreviation: string;
	projectId: string;
	projectName: string;
	githubRepoUrl: string;
	ticketNumber: number;
	title: string;
	description: string | null;
}

const claimReadyTaskSql = `
WITH candidate AS (
	SELECT task.id
	FROM "Task" task
	WHERE task.status = 'READY_FOR_DEVELOPMENT'
	ORDER BY task."updatedAt" ASC, task."createdAt" ASC, task.id ASC
	LIMIT 1
	FOR UPDATE SKIP LOCKED
), claimed AS (
	UPDATE "Task" task
	SET status = 'IN_DEVELOPMENT', "updatedAt" = NOW()
	FROM candidate
	WHERE task.id = candidate.id
	RETURNING task.id, task.title, task.description, task."ticketNumber", task."projectId"
)
SELECT
	claimed.id,
	claimed.title,
	claimed.description,
	claimed."ticketNumber",
	claimed."projectId",
	project.name AS "projectName",
	project.abbreviation AS "projectAbbreviation",
	project."githubRepoUrl"
FROM claimed
INNER JOIN "Project" project ON project.id = claimed."projectId";
`;

export const createTaskRepository = (pool: Pool): TaskClaimRepository => ({
	claimNextReadyTask: async () => {
		const result = await pool.query<ClaimedTaskRow>(claimReadyTaskSql);
		const row = result.rows[0];

		if (!row) {
			return null;
		}

		const claimedTask: ClaimedTask = {
			id: row.id,
			projectAbbreviation: row.projectAbbreviation,
			projectId: row.projectId,
			projectName: row.projectName,
			githubRepoUrl: row.githubRepoUrl,
			ticketNumber: row.ticketNumber,
			title: row.title,
			description: row.description,
		};

		return claimedTask;
	},
	assignTaskWorkspace: async (taskId, assignment) => {
		await pool.query(
			`UPDATE "Task"
			SET "branchName" = $2,
				"worktreePath" = $3,
				"updatedAt" = NOW()
			WHERE id = $1`,
			[taskId, assignment.branchName, assignment.worktreePath],
		);
	},
	returnTaskToReadyForDevelopment: async (taskId: string) => {
		await pool.query(
			`UPDATE "Task"
			SET status = 'READY_FOR_DEVELOPMENT',
				"branchName" = NULL,
				"worktreePath" = NULL,
				"updatedAt" = NOW()
			WHERE id = $1 AND status = 'IN_DEVELOPMENT'`,
			[taskId],
		);
	},
});