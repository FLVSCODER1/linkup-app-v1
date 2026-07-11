import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/.git/**", "**/*.rules.test.ts"],
  },
});
