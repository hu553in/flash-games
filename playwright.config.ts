import { defineConfig } from "@playwright/test";

export default defineConfig({
  forbidOnly: Boolean(process.env["CI"]),
  outputDir: "test-results",
  reporter: "list",
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:4173",
    launchOptions: {
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bun run serve",
    env: { BUN_PORT: "4173" },
    reuseExistingServer: false,
    url: "http://127.0.0.1:4173",
  },
  // Ruffle uses CPU rendering in headless Chromium.
  workers: 1,
});
