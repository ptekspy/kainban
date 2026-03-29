import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	workers: 1,
	globalSetup: "./e2e/global-setup.ts",
	use: {
		baseURL: "http://localhost:4000",
		trace: "on-first-retry",
	},
	webServer: [
		{
			command: "pnpm --filter api dev",
			url: "http://localhost:4001",
			reuseExistingServer: true,
			timeout: 120_000,
		},
		{
			command: "pnpm --filter web dev",
			url: "http://localhost:4000",
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
