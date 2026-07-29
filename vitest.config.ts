// Vitest configuration for RB-PMIS.
// This file enables path alias resolution for `@/` imports in unit tests.
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/": `${path.resolve(__dirname, "./src")}/`,
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
  },
});
