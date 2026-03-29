import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

const repoRootCandidates = [process.cwd(), resolve(process.cwd(), "../..")];
const repoRoot =
	repoRootCandidates.find((candidatePath) =>
		existsSync(resolve(candidatePath, "pnpm-workspace.yaml")),
	) ?? process.cwd();
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

export const getDatabaseUrl = () => {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL must be defined before using PrismaClient.");
	}

	return process.env.DATABASE_URL;
};
