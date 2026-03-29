import { afterEach, describe, expect, it, vi } from "vitest";
import { loadConfig } from "./config.js";

const originalEnvironment = { ...process.env };

const restoreEnvironment = () => {
	for (const key of Object.keys(process.env)) {
		if (!(key in originalEnvironment)) {
			delete process.env[key];
		}
	}

	for (const [key, value] of Object.entries(originalEnvironment)) {
		if (value === undefined) {
			delete process.env[key];
			continue;
		}

		process.env[key] = value;
	}
};

describe("loadConfig", () => {
	afterEach(() => {
		restoreEnvironment();
		vi.restoreAllMocks();
	});

	it("parses per-worker ollama queue config from json", () => {
		process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/kainban";
		process.env.WORKSPACE_ROOT = "/tmp/kainban-workspaces";
		process.env.DEV_WORKER_ID = "worker-b";
		process.env.OLLAMA_QUEUE_CONCURRENCY = "1";
		process.env.DEV_WORKER_OLLAMA_CONFIGS = JSON.stringify({
			"worker-a": {
				baseUrl: "http://127.0.0.1:11434",
				model: "qwen2.5-coder:14b",
				keepAlive: "15m",
				options: {
					temperature: 0.2,
				},
			},
			"worker-b": {
				baseUrl: "http://127.0.0.1:22434",
				model: "llama3.1:8b",
				requestTimeoutMs: 90_000,
				headers: {
					authorization: "Bearer dev-worker",
				},
				options: {
					num_ctx: 16_384,
				},
			},
		});

		const config = loadConfig();

		expect(config.workerId).toBe("worker-b");
		expect(config.ollamaQueue?.concurrency).toBe(1);
		expect(config.ollamaWorker).toEqual({
			baseUrl: "http://127.0.0.1:22434",
			headers: {
				authorization: "Bearer dev-worker",
			},
			keepAlive: undefined,
			model: "llama3.1:8b",
			options: {
				num_ctx: 16_384,
			},
			requestTimeoutMs: 90_000,
			workerId: "worker-b",
		});
	});

	it("builds a single-worker ollama config from fallback env vars", () => {
		process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/kainban";
		process.env.WORKSPACE_ROOT = "/tmp/kainban-workspaces";
		process.env.DEV_WORKER_ID = "worker-a";
		process.env.OLLAMA_BASE_URL = "http://127.0.0.1:11434";
		process.env.OLLAMA_MODEL = "qwen2.5-coder:14b";
		process.env.OLLAMA_KEEP_ALIVE = "20m";
		process.env.OLLAMA_REQUEST_TIMEOUT_MS = "45000";
		process.env.OLLAMA_OPTIONS = JSON.stringify({
			temperature: 0.1,
		});

		const config = loadConfig();

		expect(config.ollamaWorker?.model).toBe("qwen2.5-coder:14b");
		expect(config.ollamaWorker?.options).toEqual({
			temperature: 0.1,
		});
		expect(config.ollamaQueue?.workers["worker-a"]?.keepAlive).toBe("20m");
	});
});