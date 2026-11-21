import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // bin.ts is a three-line process entry point; everything it calls is covered.
      exclude: ["src/bin.ts", "src/version.ts"],
      reporter: [["text", { skipFull: false }], "lcov"],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
