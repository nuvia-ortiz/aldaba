import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:4173" },
  webServer: { command: "node scripts/serve.mjs 4173", url: "http://localhost:4173", reuseExistingServer: !process.env.CI },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "movil", use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } } },
  ],
});
