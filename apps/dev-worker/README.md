## dev-worker

Background worker that watches for tasks in `READY_FOR_DEVELOPMENT`, claims one by moving it to `IN_DEVELOPMENT`, and creates a git worktree for that task under `WORKSPACE_ROOT/<project-name>/`.

### Required environment

- `DATABASE_URL`: Postgres connection string for the Kainban database.
- `WORKSPACE_ROOT`: Root directory where project repos and task worktrees are created.

### Optional environment

- `GITHUB_PAT`: Used when the project repository is private.
- `DEV_WORKER_POLL_INTERVAL_MS`: Poll interval in milliseconds. Defaults to `10000`.

### Run

```sh
pnpm --filter dev-worker dev
```