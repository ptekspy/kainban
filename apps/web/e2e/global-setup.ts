import { execSync } from "node:child_process";
import { resolve } from "node:path";
import type { FullConfig } from "@playwright/test";

const run = (command: string, cwd: string) => {
	execSync(command, {
		cwd,
		stdio: "inherit",
	});
};

async function globalSetup(_config: FullConfig) {
	const repoRoot = resolve(process.cwd(), "../..");

	run("pnpm infra:local:up", repoRoot);
	run("pnpm --filter api exec prisma migrate deploy", repoRoot);
	run("pnpm --filter api db:seed", repoRoot);
}

export default globalSetup;
