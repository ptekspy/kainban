import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const loadDotEnvFile = (filePath: string) => {
	if (!existsSync(filePath)) {
		return;
	}

	for (const line of readFileSync(filePath, "utf8").split("\n")) {
		const trimmedLine = line.trim();

		if (!trimmedLine || trimmedLine.startsWith("#")) {
			continue;
		}

		const separatorIndex = trimmedLine.indexOf("=");

		if (separatorIndex === -1) {
			continue;
		}

		const key = trimmedLine.slice(0, separatorIndex).trim();
		const value = trimmedLine.slice(separatorIndex + 1).trim();

		if (!process.env[key]) {
			process.env[key] = value;
		}
	}
};

loadDotEnvFile(resolve(process.cwd(), "../../.env.local"));

const webBaseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:4000";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	workers: 1,
	globalSetup: "./e2e/global-setup.ts",
	use: {
		baseURL: webBaseUrl,
		trace: "on-first-retry",
	},
	webServer: [
		{
			command: "pnpm --filter api dev",
			url: apiBaseUrl,
			reuseExistingServer: true,
			timeout: 120_000,
		},
		{
			command: "pnpm --filter web dev",
			url: webBaseUrl,
			reuseExistingServer: true,
			timeout: 120_000,
		},
	],
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
