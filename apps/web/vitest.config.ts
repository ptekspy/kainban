import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		globals: true,
		include: ["app/**/*.test.ts", "app/**/*.test.tsx"],
		exclude: ["e2e/**", "node_modules/**", "test-results/**"],
		coverage: {
			provider: "istanbul",
			reporter: [
				[
					"json",
					{
						file: "../coverage.json",
					},
				],
			],
			enabled: true,
		},
	},
});
