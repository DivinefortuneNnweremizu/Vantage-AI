import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests run against a running app. Start the local database and the dev server first:
 *   pnpm db:dev      (in one terminal)
 *   pnpm dev         (in another, with DEV_AUTH=true in .env.local)
 * Then: pnpm test:e2e
 *
 * Every test runs twice, once per theme.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    viewport: { width: 1512, height: 982 },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "light", use: { colorScheme: "light" } },
    { name: "dark", use: { colorScheme: "dark" } },
  ],
});
