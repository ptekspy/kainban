import { resolve } from "node:path";
import type { FullConfig } from "@playwright/test";

async function globalSetup(_config: FullConfig) {
	const repoRoot = resolve(process.cwd(), "../..");
	// Playwright test isolation now happens in beforeEach inside the suite.
	// Global setup only needs infra and migrations ready.
	const { execSync } = await import("node:child_process");

	execSync("pnpm infra:local:up", {
		cwd: repoRoot,
		stdio: "inherit",
	});
	execSync("pnpm --filter api exec prisma migrate deploy", {
		cwd: repoRoot,
		stdio: "inherit",
	});
}

export default globalSetup;
