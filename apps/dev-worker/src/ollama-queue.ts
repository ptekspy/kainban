type OllamaOptionValue = boolean | number | string | null;

export interface OllamaWorkerConfig {
	baseUrl: string;
	headers: Record<string, string>;
	keepAlive?: string;
	model: string;
	options: Record<string, OllamaOptionValue>;
	requestTimeoutMs: number;
	workerId: string;
}

export interface OllamaQueueConfig {
	concurrency: number;
	defaultWorkerId: string;
	workers: Record<string, OllamaWorkerConfig>;
}

export interface OllamaGenerateJob {
	keepAlive?: string;
	options?: Record<string, OllamaOptionValue>;
	prompt: string;
	system?: string;
	workerId?: string;
}

export interface OllamaGenerateResult {
	done: boolean;
	model: string;
	response: string;
	raw: unknown;
}

interface PendingJob {
	job: OllamaGenerateJob;
	reject: (reason?: unknown) => void;
	resolve: (value: OllamaGenerateResult | PromiseLike<OllamaGenerateResult>) => void;
}

interface OllamaQueueDependencies {
	clearTimeoutFn: (timeoutId: ReturnType<typeof setTimeout>) => void;
	fetchFn: typeof fetch;
	setTimeoutFn: typeof setTimeout;
}

const defaultDependencies: OllamaQueueDependencies = {
	clearTimeoutFn: clearTimeout,
	fetchFn: fetch,
	setTimeoutFn: setTimeout,
};

const createTimeoutSignal = (
	dependencies: OllamaQueueDependencies,
	timeoutMs: number,
) => {
	const controller = new AbortController();
	const timeoutId = dependencies.setTimeoutFn(() => {
		controller.abort(new Error(`Ollama request timed out after ${timeoutMs}ms.`));
	}, timeoutMs);

	return {
		signal: controller.signal,
		clear: () => dependencies.clearTimeoutFn(timeoutId),
	};
};

const parseGenerateResponse = async (response: Response): Promise<OllamaGenerateResult> => {
	const raw = (await response.json()) as {
		done?: boolean;
		model?: string;
		response?: string;
		error?: string;
	};

	if (!response.ok) {
		throw new Error(raw.error || `Ollama request failed with status ${response.status}.`);
	}

	return {
		done: raw.done ?? true,
		model: raw.model ?? "unknown",
		response: raw.response ?? "",
		raw,
	};
};

export const createOllamaQueue = (
	config: OllamaQueueConfig,
	dependencies: OllamaQueueDependencies = defaultDependencies,
) => {
	const pendingJobs: PendingJob[] = [];
	let activeJobs = 0;

	const getWorkerConfig = (workerId?: string) => {
		const resolvedWorkerId = workerId ?? config.defaultWorkerId;
		const workerConfig = config.workers[resolvedWorkerId];

		if (!workerConfig) {
			throw new Error(`No Ollama config found for worker '${resolvedWorkerId}'.`);
		}

		return workerConfig;
	};

	const executeJob = async (pendingJob: PendingJob) => {
		const workerConfig = getWorkerConfig(pendingJob.job.workerId);
		const timeout = createTimeoutSignal(
			dependencies,
			workerConfig.requestTimeoutMs,
		);

		try {
			const response = await dependencies.fetchFn(
				new URL("/api/generate", workerConfig.baseUrl),
				{
					method: "POST",
					headers: {
						"content-type": "application/json",
						...workerConfig.headers,
					},
					body: JSON.stringify({
						model: workerConfig.model,
						prompt: pendingJob.job.prompt,
						system: pendingJob.job.system,
						stream: false,
						keep_alive: pendingJob.job.keepAlive ?? workerConfig.keepAlive,
						options: {
							...workerConfig.options,
							...pendingJob.job.options,
						},
					}),
					signal: timeout.signal,
				},
			);

			pendingJob.resolve(await parseGenerateResponse(response));
		} catch (error) {
			pendingJob.reject(error);
		} finally {
			timeout.clear();
			activeJobs -= 1;
			runNext();
		}
	};

	const runNext = () => {
		while (activeJobs < config.concurrency && pendingJobs.length > 0) {
			const pendingJob = pendingJobs.shift();

			if (!pendingJob) {
				return;
			}

			activeJobs += 1;
			void executeJob(pendingJob);
		}
	};

	return {
		generate: (job: OllamaGenerateJob) =>
			new Promise<OllamaGenerateResult>((resolve, reject) => {
				pendingJobs.push({
					job,
					reject,
					resolve,
				});
				runNext();
			}),
		getState: () => ({
			activeJobs,
			pendingJobs: pendingJobs.length,
		}),
		getWorkerConfig,
	};
};