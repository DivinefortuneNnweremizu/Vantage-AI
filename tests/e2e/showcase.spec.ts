import { expect, test, type Browser, type Page } from "@playwright/test";

import { makeDesignImage } from "./helpers";

/**
 * Showcase mode only. Run the app with SHOWCASE_MODE=true and STORAGE_DRIVER=database, then
 *   E2E_SHOWCASE=true npx playwright test showcase.spec.ts
 * Each browser gets its own temporary account, and its images live in the database.
 */
test.skip(process.env.E2E_SHOWCASE !== "true", "Needs the app to be running in showcase mode.");

test.use({ storageState: { cookies: [], origins: [] } });

async function signUp(browser: Browser, baseURL: string | undefined, name: string): Promise<Page> {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await page.goto("/sign-up");
  await expect(page.getByText("This is a showcase.")).toBeVisible();
  await page.getByLabel("Email address").fill(`${name.toLowerCase()}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("a-long-password-1");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByLabel("Full name").fill(name);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(`Hi ${name}`);
  return page;
}

test("each browser has its own private account, and images are kept in the database", async ({ browser, baseURL }) => {
  test.setTimeout(150_000);
  const ada = await signUp(browser, baseURL, "Ada");
  const grace = await signUp(browser, baseURL, "Grace");

  // Ada uploads a design. It is saved in the database, and shown back to her.
  await ada.getByLabel("Choose design images").setInputFiles({ name: "ada.png", mimeType: "image/png", buffer: await makeDesignImage("Ada") });
  await expect(ada).toHaveURL(/\/sessions\/[0-9a-f-]{36}\/upload/);
  await expect(ada.getByRole("img", { name: /Preview of ada.png/ })).toBeVisible();
  const adaSessionUrl = ada.url();

  // Grace cannot open Ada's session, even with the exact address.
  await grace.goto(adaSessionUrl);
  await expect(grace.getByRole("heading", { name: "We could not find that page" })).toBeVisible();

  // Ada can still open it, and her name is her own.
  await ada.goto(adaSessionUrl);
  await expect(ada.getByRole("heading", { name: "Upload Images" })).toBeVisible();
  await expect(ada.getByRole("button", { name: /^Account menu for Ada/ })).toBeVisible();
  await grace.goto("/");
  await expect(grace.getByRole("button", { name: /^Account menu for Grace/ })).toBeVisible();

  // Logging out and back in keeps the same account.
  await ada.getByRole("button", { name: /^Account menu for/ }).click();
  await ada.getByRole("button", { name: "Log out" }).click();
  await expect(ada).toHaveURL(/\/sign-in$/);
  await ada.getByLabel("Email address").fill("ada@example.com");
  await ada.getByLabel("Password", { exact: true }).fill("anything-at-all");
  await ada.getByRole("button", { name: "Continue" }).click();
  await expect(ada.getByRole("button", { name: /^Account menu for Ada/ })).toBeVisible();
  await ada.goto(adaSessionUrl);
  await expect(ada.getByRole("heading", { name: "Upload Images" })).toBeVisible();

  await ada.context().close();
  await grace.context().close();
});
