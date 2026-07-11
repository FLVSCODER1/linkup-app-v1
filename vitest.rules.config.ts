import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.rules.test.ts"],
    testTimeout: 15_000,
  },
});
