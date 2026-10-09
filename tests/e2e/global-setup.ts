import { chromium, type FullConfig } from "@playwright/test";

/**
 * Dev sign-in is tied to one run of the dev server, so the tests sign in through the real Log in screen
 * and save the session. Every test then starts as a returning user (auth.spec.ts starts signed out).
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://localhost:3000";
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });
  // A visitor with no account lands on Sign up. Go to Log in directly.
  await page.goto("/sign-in");
  await page.getByLabel("Email address").fill("demo@vantage.local");
  await page.getByLabel("Password", { exact: true }).fill("any-password");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 60_000 });
  await page.context().storageState({ path: "tests/e2e/.auth/state.json" });
  await browser.close();
}
