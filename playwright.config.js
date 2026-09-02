import { defineConfig } from "@playwright/test";

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  outputDir: "test-results",
  reporter: "line",
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:5173",
    launchOptions: {
      args: ["--use-gl=angle", "--use-angle=swiftshader"],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "python3 -m http.server 5173 --bind 127.0.0.1",
    reuseExistingServer: !process.env.CI,
    url: "http://127.0.0.1:5173",
  },
});
