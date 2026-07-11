import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Unit tests live next to the code they cover (src/**/*.test.ts).
    include: ["src/**/*.test.ts"],
    // Scoring is pure logic — no DOM needed. UI/e2e come later (Playwright).
    environment: "node",
  },
});
