import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { PrismaClient } from "../generated/prisma/client.js";

const repoRootCandidates = [process.cwd(), resolve(process.cwd(), "../..")];
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

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL must be defined before using PrismaClient.");
}

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
