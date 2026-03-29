import { defineConfig } from 'vitest/config';
import { uiConfig } from '@repo/vitest-config';

export default defineConfig({
  ...uiConfig,
  test: {
    ...uiConfig.test,
    // Package-specific overrides if needed
  }
});