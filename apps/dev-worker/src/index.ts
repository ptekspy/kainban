import { Pool } from "pg";
import { loadConfig } from "./config.js";
import { createTaskClaimService } from "./task-claim.js";
import { createTaskRepository } from "./task-repository.js";
import { createTaskWorktreeService } from "./worktree.js";

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const config = loadConfig();
const pool = new Pool({
	connectionString: config.databaseUrl,
	max: 3,
	connectionTimeoutMillis: 5_000,
	idleTimeoutMillis: 300_000,
});
const taskRepository = createTaskRepository(pool);
const taskClaimService = createTaskClaimService(taskRepository);
const taskWorktreeService = createTaskWorktreeService();

const shutdown = async (signal: string) => {
	console.log(`[dev-worker] received ${signal}, shutting down`);
	await pool.end();
	process.exit(0);
};

process.on("SIGINT", () => {
	void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
	void shutdown("SIGTERM");
});

const run = async () => {
	console.log(`[dev-worker] polling every ${config.pollIntervalMs}ms`);
	console.log(`[dev-worker] workspace root: ${config.workspaceRoot}`);

	for (;;) {
		const activeTask = taskClaimService.getActiveTask();

		if (activeTask) {
			await sleep(config.pollIntervalMs);
			continue;
		}

		const claimedTask = await taskClaimService.claimNextTask();

		if (!claimedTask) {
			await sleep(config.pollIntervalMs);
			continue;
		}

		console.log(
			`[dev-worker] claimed ${claimedTask.projectAbbreviation}-${claimedTask.ticketNumber}: ${claimedTask.title}`,
		);

		try {
			const result = await taskWorktreeService.ensureTaskWorktree(claimedTask, config.githubPat);
			console.log(
				`[dev-worker] locked to ${claimedTask.projectAbbreviation}-${claimedTask.ticketNumber} on ${result.branchName} at ${result.worktreePath}`,
			);
		} catch (error) {
			console.error("[dev-worker] failed to prepare task worktree", error);
			await taskClaimService.requeueActiveTask();
		}

		await sleep(config.pollIntervalMs);
	}
};

void run().catch(async (error) => {
	console.error("[dev-worker] fatal error", error);
	await pool.end();
	process.exit(1);
});