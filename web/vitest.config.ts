import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/lib/**/*.ts",
        "src/entities/**/*.ts",
        "src/shared/lib/**/*.ts",
        "src/components/**/*.tsx",
        "src/features/*/api/*.ts",
        "src/features/*/model/*.ts",
        "src/features/*/lib/*.ts",
        "src/widgets/**/*.tsx",
      ],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/**/*.test.tsx",
        "src/**/*.spec.tsx",
        "src/**/types.ts",
        "src/**/index.ts",
      ],
    },
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
