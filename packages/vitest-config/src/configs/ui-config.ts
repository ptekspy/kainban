import { defineConfig, defineProject, mergeConfig } from "vitest/config";

const sharedUiConfig = defineConfig({
  test: {
    globals: true,
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

export const uiConfig = mergeConfig(
  sharedUiConfig,
  defineProject({
    test: {
      environment: "jsdom",
    },
  })
);
