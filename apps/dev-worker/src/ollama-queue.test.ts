import { describe, expect, it, vi } from "vitest";
import {
	createOllamaQueue,
	type OllamaQueueConfig,
} from "./ollama-queue.js";

const createResponse = (body: Record<string, unknown>, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json",
		},
	});

const queueConfig: OllamaQueueConfig = {
	concurrency: 1,
	defaultWorkerId: "worker-a",
	workers: {
		"worker-a": {
			baseUrl: "http://127.0.0.1:11434",
			headers: {
				authorization: "Bearer a",
			},
			keepAlive: "10m",
			model: "qwen2.5-coder:14b",
			options: {
				temperature: 0.1,
			},
			requestTimeoutMs: 1_000,
			workerId: "worker-a",
		},
		"worker-b": {
			baseUrl: "http://127.0.0.1:22434",
			headers: {},
			keepAlive: "30m",
			model: "llama3.1:8b",
			options: {
				num_ctx: 16_384,
			},
			requestTimeoutMs: 2_000,
			workerId: "worker-b",
		},
	},
};

describe("createOllamaQueue", () => {
	it("serializes queued jobs when concurrency is one", async () => {
		let releaseFirstRequest: (() => void) | undefined;
		const fetchFn = vi
			.fn<typeof fetch>()
			.mockImplementationOnce(
				() =>
					new Promise<Response>((resolve) => {
						releaseFirstRequest = () =>
							resolve(
								createResponse({
									done: true,
									model: "qwen2.5-coder:14b",
									response: "first",
								}),
							);
					}),
			)
			.mockResolvedValueOnce(
				createResponse({
					done: true,
					model: "qwen2.5-coder:14b",
					response: "second",
				}),
			);

		const queue = createOllamaQueue(queueConfig, {
			clearTimeoutFn: clearTimeout,
			fetchFn,
			setTimeoutFn: setTimeout,
		});

		const firstRequest = queue.generate({ prompt: "first" });
		const secondRequest = queue.generate({ prompt: "second" });

		expect(fetchFn).toHaveBeenCalledTimes(1);
		releaseFirstRequest?.();

		await expect(firstRequest).resolves.toMatchObject({ response: "first" });
		await expect(secondRequest).resolves.toMatchObject({ response: "second" });
		expect(fetchFn).toHaveBeenCalledTimes(2);
	});

	it("uses the selected worker config and merges job options", async () => {
		const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
			createResponse({
				done: true,
				model: "llama3.1:8b",
				response: "ok",
			}),
		);
		const queue = createOllamaQueue(queueConfig, {
			clearTimeoutFn: clearTimeout,
			fetchFn,
			setTimeoutFn: setTimeout,
		});

		await queue.generate({
			workerId: "worker-b",
			prompt: "hello",
			options: {
				temperature: 0.4,
			},
		});

		expect(fetchFn).toHaveBeenCalledWith(
			new URL("/api/generate", "http://127.0.0.1:22434"),
			expect.objectContaining({
				headers: expect.objectContaining({
					"content-type": "application/json",
				}),
			}),
		);

		const requestInit = fetchFn.mock.calls[0]?.[1];
		expect(requestInit?.body).toBe(
			JSON.stringify({
				model: "llama3.1:8b",
				prompt: "hello",
				system: undefined,
				stream: false,
				keep_alive: "30m",
				options: {
					num_ctx: 16_384,
					temperature: 0.4,
				},
			}),
		);
	});
});