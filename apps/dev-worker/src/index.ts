import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Pool } from "pg";
import { loadConfig } from "./config.js";
import { createOllamaQueue } from "./ollama-queue.js";
import { createTaskClaimService } from "./task-claim.js";
import { createTaskExecutionService } from "./task-execution.js";
import { createTaskRepository } from "./task-repository.js";
import { createTaskWorktreeService } from "./worktree.js";

const execFileAsync = promisify(execFile);
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
const ollamaQueue = config.ollamaQueue ? createOllamaQueue(config.ollamaQueue) : null;
const taskExecutionService = ollamaQueue
	? createTaskExecutionService(
			{
				artifactRelativePath: config.artifactRelativePath,
				workerId: config.workerId,
			},
			{
				generateText: (prompt) =>
					ollamaQueue.generate({
						prompt,
						workerId: config.workerId,
					}),
			},
		)
	: null;

const runTestCommand = async (worktreePath: string, testCommand: string) => {
	await execFileAsync("bash", ["-lc", testCommand], {
		cwd: worktreePath,
		env: process.env,
	});
};

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
	console.log(`[dev-worker] worker id: ${config.workerId}`);
	console.log(`[dev-worker] workspace root: ${config.workspaceRoot}`);

	if (config.ollamaWorker && ollamaQueue) {
		console.log(
			`[dev-worker] ollama queue enabled for ${config.ollamaWorker.workerId} using ${config.ollamaWorker.model} at ${config.ollamaWorker.baseUrl}`,
		);
		console.log(
			`[dev-worker] ollama queue state active=${ollamaQueue.getState().activeJobs} pending=${ollamaQueue.getState().pendingJobs}`,
		);
	} else {
		console.log("[dev-worker] ollama queue disabled");
	}

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
			await taskRepository.assignTaskWorkspace(claimedTask.id, {
				branchName: result.branchName,
				worktreePath: result.worktreePath,
			});
			console.log(
				`[dev-worker] locked to ${claimedTask.projectAbbreviation}-${claimedTask.ticketNumber} on ${result.branchName} at ${result.worktreePath}`,
			);

			if (!taskExecutionService) {
				console.log("[dev-worker] no task execution service configured; waiting for Ollama config");
				await sleep(config.pollIntervalMs);
				continue;
			}

			const executionResult = await taskExecutionService.executeInWorktree(
				claimedTask,
				result.worktreePath,
			);
			console.log(
				`[dev-worker] wrote execution artifact to ${executionResult.artifactPath}`,
			);

			if (config.testCommand) {
				await runTestCommand(result.worktreePath, config.testCommand);
				console.log(`[dev-worker] test command passed: ${config.testCommand}`);
			}
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