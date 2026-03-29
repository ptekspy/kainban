import { defineConfig } from "vitest/config";

export const sharedConfig = defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "istanbul",
      reporter: [
        [
          "json",
          {
            file: `../coverage.json`,
          },
        ],
      ],
      enabled: true,
    },
  },
});
