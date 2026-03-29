import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import type { OllamaQueueConfig, OllamaWorkerConfig } from "./ollama-queue.js";

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
	artifactRelativePath: string;
	databaseUrl: string;
	githubPat?: string;
	ollamaQueue?: OllamaQueueConfig;
	ollamaWorker?: OllamaWorkerConfig;
	pollIntervalMs: number;
	testCommand?: string;
	workerId: string;
	workspaceRoot: string;
}

type JsonValue =
	| boolean
	| number
	| string
	| null
	| JsonValue[]
	| { [key: string]: JsonValue };

const parseInteger = (
	value: string | undefined,
	variableName: string,
	minimumValue: number,
	fallbackValue: number,
) => {
	if (!value) {
		return fallbackValue;
	}

	const parsedValue = Number.parseInt(value, 10);

	if (!Number.isFinite(parsedValue) || parsedValue < minimumValue) {
		throw new Error(`${variableName} must be an integer greater than or equal to ${minimumValue}.`);
	}

	return parsedValue;
};

const isJsonRecord = (value: JsonValue | undefined): value is Record<string, JsonValue> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const parseJsonRecord = (value: string | undefined, variableName: string) => {
	if (!value) {
		return undefined;
	}

	let parsedValue: JsonValue;

	try {
		parsedValue = JSON.parse(value) as JsonValue;
	} catch {
		throw new Error(`${variableName} must contain valid JSON.`);
	}

	if (!isJsonRecord(parsedValue)) {
		throw new Error(`${variableName} must contain a JSON object.`);
	}

	return parsedValue;
};

const parseStringMap = (value: JsonValue | undefined, variableName: string) => {
	if (value === undefined) {
		return {};
	}

	if (!isJsonRecord(value)) {
		throw new Error(`${variableName} must be an object of string values.`);
	}

	const entries = Object.entries(value).map(([key, entryValue]) => {
		if (typeof entryValue !== "string") {
			throw new Error(`${variableName}.${key} must be a string.`);
		}

		return [key, entryValue] as const;
	});

	return Object.fromEntries(entries);
};

const parseOllamaOptions = (value: JsonValue | undefined, variableName: string) => {
	if (value === undefined) {
		return {};
	}

	if (!isJsonRecord(value)) {
		throw new Error(`${variableName} must be an object of JSON primitive values.`);
	}

	const entries = Object.entries(value).map(([key, entryValue]) => {
		if (
			typeof entryValue === "string" ||
			typeof entryValue === "number" ||
			typeof entryValue === "boolean" ||
			entryValue === null
		) {
			return [key, entryValue] as const;
		}

		throw new Error(`${variableName}.${key} must be a string, number, boolean, or null.`);
	});

	return Object.fromEntries(entries);
};

const createOllamaWorkerConfig = (
	workerId: string,
	workerConfigValue: JsonValue,
	variableName: string,
): OllamaWorkerConfig => {
	if (!isJsonRecord(workerConfigValue)) {
		throw new Error(`${variableName}.${workerId} must be an object.`);
	}

	const baseUrl = workerConfigValue.baseUrl;
	const model = workerConfigValue.model;

	if (typeof baseUrl !== "string" || !baseUrl) {
		throw new Error(`${variableName}.${workerId}.baseUrl must be a non-empty string.`);
	}

	if (typeof model !== "string" || !model) {
		throw new Error(`${variableName}.${workerId}.model must be a non-empty string.`);
	}

	const keepAlive = workerConfigValue.keepAlive;
	if (keepAlive !== undefined && typeof keepAlive !== "string") {
		throw new Error(`${variableName}.${workerId}.keepAlive must be a string when provided.`);
	}

	const requestTimeoutMs = workerConfigValue.requestTimeoutMs;

	return {
		baseUrl,
		headers: parseStringMap(workerConfigValue.headers, `${variableName}.${workerId}.headers`),
		keepAlive,
		model,
		options: parseOllamaOptions(workerConfigValue.options, `${variableName}.${workerId}.options`),
		requestTimeoutMs:
			typeof requestTimeoutMs === "number" && Number.isFinite(requestTimeoutMs) && requestTimeoutMs >= 1_000
				? requestTimeoutMs
				: 120_000,
		workerId,
	};
};

const loadOllamaQueueConfig = (workerId: string): OllamaQueueConfig | undefined => {
	const ollamaConfigRecord = parseJsonRecord(
		process.env.DEV_WORKER_OLLAMA_CONFIGS,
		"DEV_WORKER_OLLAMA_CONFIGS",
	);

	if (ollamaConfigRecord) {
		const workers = Object.fromEntries(
			Object.entries(ollamaConfigRecord).map(([configuredWorkerId, workerConfigValue]) => [
				configuredWorkerId,
				createOllamaWorkerConfig(
					configuredWorkerId,
					workerConfigValue,
					"DEV_WORKER_OLLAMA_CONFIGS",
				),
			]),
		);

		if (!(workerId in workers)) {
			throw new Error(`DEV_WORKER_OLLAMA_CONFIGS must include a config for worker '${workerId}'.`);
		}

		return {
			concurrency: parseInteger(process.env.OLLAMA_QUEUE_CONCURRENCY, "OLLAMA_QUEUE_CONCURRENCY", 1, 1),
			defaultWorkerId: workerId,
			workers,
		};
	}

	const ollamaModel = process.env.OLLAMA_MODEL;

	if (!ollamaModel) {
		return undefined;
	}

	return {
		concurrency: parseInteger(process.env.OLLAMA_QUEUE_CONCURRENCY, "OLLAMA_QUEUE_CONCURRENCY", 1, 1),
		defaultWorkerId: workerId,
		workers: {
			[workerId]: {
				baseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
				headers: parseStringMap(
					parseJsonRecord(process.env.OLLAMA_HEADERS, "OLLAMA_HEADERS"),
					"OLLAMA_HEADERS",
				),
				keepAlive: process.env.OLLAMA_KEEP_ALIVE,
				model: ollamaModel,
				options: parseOllamaOptions(
					parseJsonRecord(process.env.OLLAMA_OPTIONS, "OLLAMA_OPTIONS"),
					"OLLAMA_OPTIONS",
				),
				requestTimeoutMs: parseInteger(
					process.env.OLLAMA_REQUEST_TIMEOUT_MS,
					"OLLAMA_REQUEST_TIMEOUT_MS",
					1_000,
					120_000,
				),
				workerId,
			},
		},
	};
};

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
	const workerId = process.env.DEV_WORKER_ID ?? "dev-worker-1";

	if (!databaseUrl) {
		throw new Error("DATABASE_URL must be defined before starting dev-worker.");
	}

	if (!workspaceRoot) {
		throw new Error("WORKSPACE_ROOT must be defined before starting dev-worker.");
	}

	const ollamaQueue = loadOllamaQueueConfig(workerId);

	return {
		artifactRelativePath: process.env.DEV_WORKER_ARTIFACT_RELATIVE_PATH ?? ".dev-worker/execution-note.md",
		databaseUrl,
		githubPat: process.env.GITHUB_PAT,
		ollamaQueue,
		ollamaWorker: ollamaQueue?.workers[workerId],
		pollIntervalMs: parsePollInterval(process.env.DEV_WORKER_POLL_INTERVAL_MS),
		testCommand: process.env.DEV_WORKER_TEST_COMMAND,
		workerId,
		workspaceRoot,
	};
};