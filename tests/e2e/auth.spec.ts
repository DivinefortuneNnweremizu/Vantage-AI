import { expect, test } from "@playwright/test";

// These tests start signed out. The other tests start as a returning user (see playwright.config.ts).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("log in, sign up, and onboarding", () => {
  test("a new visitor lands on Sign up, a returning one on Log in", async ({ page }) => {
    // No account in this browser yet: the front door is Sign up (then onboarding).
    await page.goto("/");
    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();

    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await page.getByLabel("Email address").fill("demo@example.com");
    await page.getByLabel("Password", { exact: true }).fill("any-password");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hi Demo");

    // After logging out, this browser has an account, so the front door is now Log in.
    await page.getByRole("button", { name: /^Account menu for/ }).click();
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("Log in checks the fields", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Enter your email.")).toBeVisible();
  });

  test("Sign up asks for a name afterwards, then greets the user by it", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
    // Only an email and a password. No social buttons.
    await expect(page.getByRole("button", { name: /google|apple|phone/i })).toHaveCount(0);

    await page.getByLabel("Email address").fill("ada@example.com");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page.getByRole("button", { name: "Continue" }).click();
    // The hint under the field is always there, so wait for the error itself (it keeps the email, too).
    await expect(page.locator("[aria-live=polite]")).toContainText("Use at least 10 characters.");
    await expect(page.getByLabel("Email address")).toHaveValue("ada@example.com");

    await page.getByLabel("Password", { exact: true }).fill("a-long-password-1");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/welcome$/);
    await expect(page.getByRole("heading", { name: "What should we call you?" })).toBeVisible();

    // The app is closed until the name is given.
    await page.goto("/library");
    await expect(page).toHaveURL(/\/welcome$/);

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Enter your name.")).toBeVisible();
    await page.getByLabel("Full name").fill("Ada Lovelace");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hi Ada");

    // Once onboarded, this browser is no longer new: signed out, it goes to Log in.
    await page.context().clearCookies({ name: "vantage-dev-session" });
    await page.goto("/");
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("Log out returns to Log in", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email address").fill("demo@example.com");
    await page.getByLabel("Password", { exact: true }).fill("any-password");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole("button", { name: /^Account menu for/ }).click();
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/sign-in$/);
  });
});
