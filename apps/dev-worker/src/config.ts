import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

const repoRootCandidates = [process.cwd(), resolve(process.cwd(), "../..")] as const;
const repoRoot =
	repoRootCandidates.find((candidatePath) => existsSync(resolve(candidatePath, "pnpm-workspace.yaml"))) ??
	process.cwd();
const localEnvPath = `${repoRoot}/.env.local`;
const productionEnvPath = `${repoRoot}/.env`;

config({
	path:
		process.env.NODE_ENV === "production"
			? productionEnvPath
			: existsSync(localEnvPath)
				? localEnvPath
				: productionEnvPath,
});

export interface DevWorkerConfig {
	databaseUrl: string;
	githubPat?: string;
	pollIntervalMs: number;
	workspaceRoot: string;
}

const parsePollInterval = (pollIntervalValue: string | undefined) => {
	if (!pollIntervalValue) {
		return 10_000;
	}

	const pollInterval = Number.parseInt(pollIntervalValue, 10);

	if (!Number.isFinite(pollInterval) || pollInterval < 1_000) {
		throw new Error("DEV_WORKER_POLL_INTERVAL_MS must be an integer greater than or equal to 1000.");
	}

	return pollInterval;
};

export const loadConfig = (): DevWorkerConfig => {
	const databaseUrl = process.env.DATABASE_URL;
	const workspaceRoot = process.env.WORKSPACE_ROOT;

	if (!databaseUrl) {
		throw new Error("DATABASE_URL must be defined before starting dev-worker.");
	}

	if (!workspaceRoot) {
		throw new Error("WORKSPACE_ROOT must be defined before starting dev-worker.");
	}

	return {
		databaseUrl,
		githubPat: process.env.GITHUB_PAT,
		pollIntervalMs: parsePollInterval(process.env.DEV_WORKER_POLL_INTERVAL_MS),
		workspaceRoot,
	};
};