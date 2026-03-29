import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

const repoRootCandidates = [process.cwd(), resolve(process.cwd(), "../..")];
const repoRoot =
	repoRootCandidates.find((candidatePath) =>
		existsSync(resolve(candidatePath, "pnpm-workspace.yaml")),
	) ?? process.cwd();
const localEnvPath = `${repoRoot}/.env.local`;
const productionEnvPath = `${repoRoot}/.env`;

config({
	path:
		process.env["NODE_ENV"] === "production"
			? productionEnvPath
			: existsSync(localEnvPath)
				? localEnvPath
				: productionEnvPath,
});

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
