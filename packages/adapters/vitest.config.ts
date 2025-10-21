import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.[jt]s"],
    exclude: ["node_modules", "dist", ".turbo"],
  },
});
