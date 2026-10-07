import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Automated WCAG 2.1 A and AA checks on every screen, in both themes (the project decides the theme).
 * Automation only finds part of the problems, so the manual checks in .agents/rules/accessibility.md still apply.
 */
async function audit(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return results.violations.map((violation) => {
    const targets = violation.nodes
      .slice(0, 3)
      .map((node) => node.target.join(" "))
      .join(" | ");
    return `${violation.id} (${violation.impact}): ${violation.help} -> ${targets}`;
  });
}

async function openLatestReport(page: Page): Promise<string> {
  await page.goto("/library");
  const link = page.getByRole("link", { name: /Flowboard landing/ }).first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  if (!href) throw new Error("No analyzed session found. Run flow.spec.ts first.");
  return href;
}

test.describe("accessibility", () => {
  test("New Session", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });

  test("Design Library", async ({ page }) => {
    await page.goto("/library");
    await expect(page.getByRole("heading", { name: "Design Library" })).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });

  test("Settings and Privacy", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings and Privacy" })).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });

  for (const tab of ["takeaways", "score", "sentiment", "recommendations", "assistant"] as const) {
    test(`report: ${tab}`, async ({ page }) => {
      const href = await openLatestReport(page);
      await page.goto(`${href}?tab=${tab}`);
      await expect(page.getByRole("tablist", { name: "Report sections" })).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(await audit(page)).toEqual([]);
    });
  }
});
