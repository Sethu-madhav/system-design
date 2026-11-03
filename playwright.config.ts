import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "e2e",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  use: {
    baseURL: "http://localhost:4173",
  },
  webServer: [
    {
      command: "pnpm build && pnpm preview --port 4173 --strictPort",
      url: "http://localhost:4173",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "pnpm preview --port 4174 --strictPort --base /system-design/",
      url: "http://localhost:4174/system-design/",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
})
