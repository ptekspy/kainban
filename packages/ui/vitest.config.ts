import { uiConfig } from "@repo/vitest-config/ui";
import { defineConfig } from "vitest/config";

export default defineConfig({
	...uiConfig,
	test: {
		...uiConfig.test,
		// Package-specific overrides if needed
	},
});
