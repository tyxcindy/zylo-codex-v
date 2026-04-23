import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const webServerUrl = process.env.PLAYWRIGHT_BASE_URL
  ? undefined
  : "http://127.0.0.1:3000/api/health";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: webServerUrl,
        reuseExistingServer: !process.env.CI
      },
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
