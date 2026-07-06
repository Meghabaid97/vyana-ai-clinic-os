import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Vyana end-to-end tests.
 *
 * The Vite dev server is expected to already be running on localhost:8080
 * (that's how the Lovable sandbox is configured). If you want Playwright
 * to boot it for you, uncomment the `webServer` block below.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:8080",
    viewport: { width: 1280, height: 1800 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // webServer: {
  //   command: "bun run dev",
  //   url: "http://localhost:8080",
  //   reuseExistingServer: true,
  //   timeout: 120_000,
  // },
});
