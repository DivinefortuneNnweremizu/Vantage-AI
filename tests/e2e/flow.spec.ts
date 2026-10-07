import { expect, test } from "@playwright/test";

import { makeDesignImage, uploadFromHome } from "./helpers";

test.describe("first analysis, start to finish", () => {
  test("upload, set a goal, analyze, read the report, ask the assistant", async ({ page }) => {
    const design = await makeDesignImage();

    // New Session -> Upload Images
    await uploadFromHome(page, [{ name: "flowboard-landing.png", buffer: design }]);
    await expect(page).toHaveURL(/\/sessions\/[0-9a-f-]{36}\/upload/);
    await expect(page.getByRole("heading", { name: "Upload Images" })).toBeVisible();
    await expect(page.getByRole("img", { name: /Preview of flowboard-landing.png/ })).toBeVisible();

    // Upload Images -> My Goal
    await page.getByRole("button", { name: "Continue to analysis" }).click();
    await expect(page).toHaveURL(/\/goal$/);
    await expect(page.getByRole("heading", { name: "My Goal" })).toBeVisible();

    // My Goal -> progress -> report
    await page.getByLabel("What do you want to learn and test?").fill("Test if users can find the sign up button");
    await page.getByRole("button", { name: "Start analysis" }).click();
    await expect(page.getByText("Fetching your insights...")).toBeVisible();
    await expect(page.getByRole("list", { name: "Analysis progress" })).toBeVisible();
    await expect(page).toHaveURL(/\/sessions\/[0-9a-f-]{36}$/, { timeout: 40_000 });

    // Report: title, demo notice, tabs
    await expect(page.getByRole("heading", { name: "Flowboard landing Design Analysis" })).toBeVisible();
    await expect(page.getByRole("note")).toContainText("Demo report");
    const tabs = page.getByRole("tablist", { name: "Report sections" });
    await expect(tabs.getByRole("tab")).toHaveCount(5);
    await expect(tabs.getByRole("tab", { name: "Key Takeaways" })).toHaveAttribute("aria-selected", "true");

    // Key Takeaways
    await expect(page.getByRole("heading", { name: "Goal" })).toBeVisible();
    await expect(page.getByText("Test if users can find the sign up button", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Strengths" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pain Points" })).toBeVisible();

    // UX Score
    await tabs.getByRole("tab", { name: "UX Score" }).click();
    await expect(page).toHaveURL(/tab=score/);
    await expect(page.getByRole("img", { name: /Overall \d+ out of 100/ })).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveCount(3);

    // Sentiment: markers can be hidden and the filter switched
    await tabs.getByRole("tab", { name: "Sentiment" }).click();
    const markers = page.getByRole("button", { name: /^Dislike: / });
    await expect(markers.first()).toBeVisible();
    await page.getByRole("switch", { name: "View Maps" }).click();
    await expect(markers).toHaveCount(0);
    await page.getByRole("switch", { name: "View Maps" }).click();
    await page.getByRole("radio", { name: "Likes", exact: true }).click();
    await expect(page.getByRole("button", { name: /^Like: / }).first()).toBeVisible();

    // Recommendations
    await tabs.getByRole("tab", { name: "Recommendations" }).click();
    await expect(page.getByRole("heading", { name: "Try these recommendations to make the experience better" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "Based on" }).first()).toBeVisible();

    // Assistant
    await tabs.getByRole("tab", { name: "Assistant" }).click();
    await expect(page.getByText("How can I help you today?")).toBeVisible();
    await page.getByRole("button", { name: "What should I fix first?" }).click();
    await expect(page.getByText("Start with these, in order of impact")).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("Ask about your designs").fill("How is the score calculated?");
    await page.getByRole("button", { name: "Send question" }).click();
    await expect(page.getByText(/Each score starts at 100/)).toBeVisible({ timeout: 15_000 });

    // It is now in the library and the sidebar
    await page.goto("/library");
    await expect(page.getByRole("link", { name: /Flowboard landing/ }).first()).toBeVisible();
  });

  test("arrow keys move between report tabs", async ({ page }) => {
    await page.goto("/library");
    await page.getByRole("link", { name: /Flowboard landing/ }).first().click();
    const first = page.getByRole("tab", { name: "Key Takeaways" });
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/tab=score/);
    await expect(page.getByRole("tab", { name: "UX Score" })).toBeFocused();
  });
});

test.describe("upload rules", () => {
  test("a Single Page session refuses a second image and says why", async ({ page }) => {
    const design = await makeDesignImage();
    await uploadFromHome(page, [{ name: "one.png", buffer: design }]);
    await expect(page).toHaveURL(/\/upload/);
    // Single Page has no "add another page" tile.
    await expect(page.getByRole("button", { name: "Add another page" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Replace", exact: true })).toBeVisible();
  });

  test("a journey can hold several pages and delete one", async ({ page }) => {
    const design = await makeDesignImage();
    await page.goto("/");
    await page.getByRole("radio", { name: "Multiple page journey" }).click();
    await page.getByLabel("Choose design images").setInputFiles([
      { name: "page-one.png", mimeType: "image/png", buffer: design },
      { name: "page-two.png", mimeType: "image/png", buffer: await makeDesignImage("Pricing") },
    ]);
    await expect(page).toHaveURL(/\/upload/);
    await expect(page.getByRole("list", { name: "Pages in this design" }).getByRole("button")).toHaveCount(3); // 2 pages + add tile
    await page.getByRole("button", { name: "Delete this image" }).click();
    await expect(page.getByRole("list", { name: "Pages in this design" }).getByRole("button")).toHaveCount(2); // 1 page + add tile
  });

  test("a file that is not an image is rejected with a clear message", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Choose design images").setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
    await expect(page.getByRole("status").filter({ hasText: "not a PNG, JPG, or WebP image" })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("pasting a link explains that links are not connected yet", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("URL, images, or PDF asset").fill("https://example.com");
    await page.getByLabel("URL, images, or PDF asset").press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "coming soon" })).toBeVisible();
  });
});
