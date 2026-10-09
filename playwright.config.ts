import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests run against a running app. Start it first, with DEV_AUTH=true in .env.local:
 *   npm run dev      (in one terminal; it starts the database too)
 * Then: npm run test:e2e   (in another)
 *
 * Every test runs twice, once per theme.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    // Signed in once by global-setup.ts. auth.spec.ts starts signed out instead.
    storageState: "tests/e2e/.auth/state.json",
    viewport: { width: 1512, height: 982 },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "light", use: { colorScheme: "light" } },
    { name: "dark", use: { colorScheme: "dark" } },
  ],
});
