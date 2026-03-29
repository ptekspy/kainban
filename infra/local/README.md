# Local Infra

`infra/local` runs the local PostgreSQL dependency for the repo.

Local infrastructure reads from the root `.env.local`.

Production infrastructure should read from the root `.env`.

Create a root `.env.local` with at least:

```env
POSTGRES_DB=kainban
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kainban
```

Run from the repo root:

```bash
pnpm infra:local:up
```

Stop it with:

```bash
pnpm infra:local:down
```
