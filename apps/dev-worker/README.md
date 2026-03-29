## dev-worker

Background worker that watches for tasks in `READY_FOR_DEVELOPMENT`, claims one by moving it to `IN_DEVELOPMENT`, and creates a git worktree for that task under `WORKSPACE_ROOT/<project-name>/`.

### Required environment

- `DATABASE_URL`: Postgres connection string for the Kainban database.
- `WORKSPACE_ROOT`: Root directory where project repos and task worktrees are created.

### Optional environment

- `GITHUB_PAT`: Used when the project repository is private.
- `DEV_WORKER_POLL_INTERVAL_MS`: Poll interval in milliseconds. Defaults to `10000`.
- `DEV_WORKER_ID`: Stable worker identifier. Defaults to `dev-worker-1`.
- `OLLAMA_QUEUE_CONCURRENCY`: Maximum concurrent Ollama requests across the in-process queue. Defaults to `1`.
- `DEV_WORKER_OLLAMA_CONFIGS`: JSON object keyed by worker id, where each value can include `baseUrl`, `model`, `keepAlive`, `requestTimeoutMs`, `headers`, and `options`.
- `OLLAMA_MODEL`: Fallback single-worker model when `DEV_WORKER_OLLAMA_CONFIGS` is not used.
- `OLLAMA_BASE_URL`: Fallback single-worker Ollama base URL. Defaults to `http://127.0.0.1:11434`.
- `OLLAMA_KEEP_ALIVE`: Fallback single-worker Ollama keep-alive value.
- `OLLAMA_REQUEST_TIMEOUT_MS`: Fallback single-worker request timeout. Defaults to `120000`.
- `OLLAMA_HEADERS`: Fallback single-worker JSON object of request headers.
- `OLLAMA_OPTIONS`: Fallback single-worker JSON object of Ollama generation options.
- `DEV_WORKER_ARTIFACT_RELATIVE_PATH`: Relative path inside the task worktree where the Ollama execution note is written. Defaults to `.dev-worker/execution-note.md`.
- `DEV_WORKER_TEST_COMMAND`: Optional shell command to run inside the task worktree after the artifact is written.

### Multi-worker Ollama config

```json
{
	"worker-a": {
		"baseUrl": "http://127.0.0.1:11434",
		"model": "qwen2.5-coder:14b",
		"keepAlive": "15m",
		"options": {
			"temperature": 0.1,
			"num_ctx": 16384
		}
	},
	"worker-b": {
		"baseUrl": "http://127.0.0.1:22434",
		"model": "llama3.1:8b",
		"requestTimeoutMs": 90000,
		"options": {
			"temperature": 0.2
		}
	}
}
```

### Run

```sh
pnpm --filter dev-worker dev
```

### Current execution behavior

When a task is claimed, the worker currently uses Ollama to generate a markdown execution note from the task title and writes it into the claimed worktree. This is the first verified in-worktree mutation path.