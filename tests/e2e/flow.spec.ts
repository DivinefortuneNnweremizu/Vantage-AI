import { expect, test } from "@playwright/test";

import { makeDesignImage, uploadFromHome } from "./helpers";

test.describe("first analysis, start to finish", () => {
  test("upload, set a goal, analyze, read the report, ask the assistant", async ({ page }) => {
    // The first request to each route after a fresh start compiles it, which can take a while.
    test.setTimeout(150_000);
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
    // The animation and the step list are side by side, and both are on screen at once.
    const headline = page.getByText("Fetching your insights...");
    const steps = page.getByRole("list", { name: "Analysis progress" });
    await expect(headline).toBeInViewport();
    await expect(steps).toBeInViewport();
    const headlineBox = await headline.boundingBox();
    const stepsBox = await steps.boundingBox();
    expect(headlineBox && stepsBox && headlineBox.x + headlineBox.width <= stepsBox.x).toBe(true);
    await expect(page).toHaveURL(/\/sessions\/[0-9a-f-]{36}$/, { timeout: 40_000 });

    // Report: title, demo notice, tabs
    await expect(page.getByRole("heading", { name: "Flowboard landing Design Analysis" })).toBeVisible();
    await expect(page.getByRole("note")).toContainText("Demo report");
    const tabs = page.getByRole("tablist", { name: "Report sections" });
    await expect(tabs.getByRole("tab")).toHaveCount(5);
    // Sentiment and Recommendations come first. Sentiment opens by default.
    const tabNames = (await tabs.getByRole("tab").allTextContents()).map((name) => name.trim());
    expect(tabNames).toEqual(["Sentiment", "Recommendations", "Key Takeaways", "UX Score", "Assistant"]);
    await expect(tabs.getByRole("tab", { name: "Sentiment" })).toHaveAttribute("aria-selected", "true");

    // Sentiment: the design is on the left and the findings on the right. Most of the design is visible on arrival,
    // and it stays fully in view (sticky) while the findings scroll.
    const shownDesign = page.getByRole("img", { name: /^Analyzed design: .*Markers are listed beside it/ });
    const whatToFix = page.getByRole("heading", { name: "What to fix" });
    await expect(shownDesign).toBeInViewport({ ratio: 0.6 });
    await expect(whatToFix).toBeInViewport();
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeInViewport();
    const designBox = await shownDesign.boundingBox();
    const textBox = await whatToFix.boundingBox();
    expect(designBox && textBox && designBox.x + designBox.width <= textBox.x).toBe(true);

    // "View Maps" is above the heading, and the design is tall enough to read.
    const toggleBox = await page.getByRole("switch", { name: "View Maps" }).boundingBox();
    expect(toggleBox && textBox && toggleBox.y + toggleBox.height <= textBox.y).toBe(true);
    // A tall design (such as a phone screen) may grow to almost the full screen height. The picture in this
    // test is wide, so it is limited by the column width instead. Check the limit itself.
    const maxHeight = await shownDesign.evaluate((element) => Number.parseFloat(getComputedStyle(element).maxHeight));
    const viewportHeight = page.viewportSize()?.height ?? 0;
    expect(maxHeight).toBeGreaterThanOrEqual(viewportHeight - 15 * 16 - 1);

    // Scrolling the findings keeps the whole design in view.
    await page.mouse.wheel(0, 300);
    await expect(shownDesign).toBeInViewport({ ratio: 0.95 });
    await page.mouse.wheel(0, -300);

    // Markers can be hidden and the filter switched.
    const markers = page.getByRole("button", { name: /^Dislike: / });
    await expect(markers.first()).toBeVisible();
    await page.getByRole("switch", { name: "View Maps" }).click();
    await expect(markers).toHaveCount(0);
    await page.getByRole("switch", { name: "View Maps" }).click();
    await page.getByRole("radio", { name: "Likes", exact: true }).click();
    await expect(page.getByRole("button", { name: /^Like: / }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "What works" })).toBeVisible();

    // "Show on design" is a real, labelled button, and it jumps to the matching marker.
    await page.getByRole("button", { name: /^Show .* on the design$/ }).first().click();
    await expect(page.getByRole("button", { name: /^Like: / }).first()).toBeFocused();

    // Recommendations: same layout, design on the left and the list on the right, both in view.
    await tabs.getByRole("tab", { name: "Recommendations" }).click();
    await expect(page).toHaveURL(/tab=recommendations/);
    const recsDesign = page.getByRole("img", { name: /^Analyzed design:/ });
    const recsHeading = page.getByRole("heading", { name: "Try these recommendations to make the experience better" });
    await expect(recsDesign).toBeInViewport({ ratio: 0.6 });
    await expect(recsHeading).toBeInViewport();
    await expect(page.getByRole("heading", { name: /Recommendation 1:/ })).toBeInViewport();
    const recsDesignBox = await recsDesign.boundingBox();
    const recsTextBox = await recsHeading.boundingBox();
    expect(recsDesignBox && recsTextBox && recsDesignBox.x + recsDesignBox.width <= recsTextBox.x).toBe(true);
    await expect(page.getByRole("listitem").filter({ hasText: "Based on" }).first()).toBeVisible();

    // Key Takeaways
    await tabs.getByRole("tab", { name: "Key Takeaways" }).click();
    await expect(page).toHaveURL(/tab=takeaways/);
    await expect(page.getByRole("heading", { name: "Goal" })).toBeVisible();
    await expect(page.getByText("Test if users can find the sign up button", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Strengths" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pain Points" })).toBeVisible();

    // UX Score
    await tabs.getByRole("tab", { name: "UX Score" }).click();
    await expect(page).toHaveURL(/tab=score/);
    await expect(page.getByRole("img", { name: /Overall \d+ out of 100/ })).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveCount(3);

    // Assistant
    await tabs.getByRole("tab", { name: "Assistant" }).click();
    await expect(page.getByText("How can I help you today?")).toBeVisible();
    await page.getByRole("button", { name: "What should I fix first?" }).click();
    await expect(page.getByRole("log", { name: "Conversation" }).getByText("Start with these, in order of impact")).toBeVisible({ timeout: 30_000 });
    await page.getByLabel("Ask about your designs").fill("How is the score calculated?");
    await page.getByRole("button", { name: "Send question" }).click();
    await expect(page.getByRole("log", { name: "Conversation" }).getByText(/Each score starts at 100/)).toBeVisible({ timeout: 30_000 });

    // It is now in the library and the sidebar
    await page.goto("/library");
    await expect(page.getByRole("link", { name: /Flowboard landing/ }).first()).toBeVisible();
  });

  test("arrow keys move between report tabs", async ({ page }) => {
    await page.goto("/library");
    await page.getByRole("link", { name: /Flowboard landing/ }).first().click();
    const first = page.getByRole("tab", { name: "Sentiment" });
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/tab=recommendations/);
    await expect(page.getByRole("tab", { name: "Recommendations" })).toBeFocused();
  });
});

test.describe("upload rules", () => {
  test("the dashed add tile is always there, and adding a page turns a Single Page session into a journey", async ({ page }) => {
    const design = await makeDesignImage();
    await uploadFromHome(page, [{ name: "one.png", buffer: design }]);
    await expect(page).toHaveURL(/\/upload/);

    const pages = page.getByRole("list", { name: "Pages in this design" }).getByRole("button");
    await expect(pages).toHaveCount(2); // 1 page + the add tile
    await expect(page.getByRole("button", { name: "Add another page" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Replace", exact: true })).toBeVisible();

    // Add a second page through the tile.
    await page.getByLabel("Add design images").setInputFiles({
      name: "two.png",
      mimeType: "image/png",
      buffer: await makeDesignImage("Pricing"),
    });
    await expect(pages).toHaveCount(3); // 2 pages + the add tile
    await expect(page.getByRole("status").filter({ hasText: "now a Multiple page journey" })).toBeVisible();

    // The goal step knows it is a journey.
    await page.getByRole("button", { name: "Continue to analysis" }).click();
    await expect(page.getByText("All 2 pages will be analyzed as one journey.")).toBeVisible();
  });

  test("choosing several images on the home screen makes a journey even if Single Page was selected", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Choose design images").setInputFiles([
      { name: "a.png", mimeType: "image/png", buffer: await makeDesignImage("A") },
      { name: "b.png", mimeType: "image/png", buffer: await makeDesignImage("B") },
    ]);
    await expect(page).toHaveURL(/\/upload/);
    await expect(page.getByRole("list", { name: "Pages in this design" }).getByRole("button")).toHaveCount(3);
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

test.describe("New Session layout, like ChatGPT", () => {
  test("mobile: greeting centered in the free space, chat box pinned to the bottom", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const greeting = page.getByRole("heading", { level: 1 });
    const box = page.getByRole("form").or(page.locator("form").filter({ has: page.getByLabel("URL, images, or PDF asset") })).first();
    await expect(greeting).toBeInViewport();
    await expect(box).toBeInViewport({ ratio: 1 });

    const greetingBox = await greeting.boundingBox();
    const formBox = await box.boundingBox();
    expect(greetingBox && formBox && greetingBox.y + greetingBox.height < formBox.y).toBe(true);
    // The chat box sits near the bottom of the screen.
    expect(formBox && formBox.y + formBox.height >= 844 - 80).toBe(true);
    // Greeting is horizontally centered.
    expect(greetingBox && Math.abs(greetingBox.x + greetingBox.width / 2 - 195) < 8).toBe(true);

    // "+" is on the left and the primary button on the right, below the text.
    const input = await page.getByLabel("URL, images, or PDF asset").boundingBox();
    const plus = await page.getByRole("button", { name: "Add images" }).and(page.locator(":visible")).boundingBox();
    const action = await page.getByRole("button", { name: "Choose images from your files" }).and(page.locator(":visible")).boundingBox();
    expect(input && plus && action && plus.y >= input.y + input.height - 1 && action.y >= input.y + input.height - 1).toBe(true);
    expect(plus && action && plus.x < action.x).toBe(true);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("desktop: greeting and chat box are centered together", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const greeting = await page.getByRole("heading", { level: 1 }).boundingBox();
    const form = await page.locator("form").filter({ has: page.getByLabel("URL, images, or PDF asset") }).boundingBox();
    expect(greeting && form && greeting.y + greeting.height <= form.y).toBe(true);
    if (!greeting || !form) return;
    const groupMiddle = (greeting.y + form.y + form.height) / 2;
    // Middle of the group is near the middle of the content area (below the ~64px header).
    expect(Math.abs(groupMiddle - (64 + (900 - 64) / 2))).toBeLessThan(80);
  });
});

test.describe("profile menu and theme toggle", () => {
  test("the profile row opens Settings and Log out", async ({ page }) => {
    await page.goto("/");
    const profile = page.getByRole("button", { name: /^Account menu for/ });
    await expect(page.getByRole("link", { name: "Settings and Privacy" })).toHaveCount(0);
    await profile.click();
    await expect(profile).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Log out" })).toHaveCount(0);
    await expect(profile).toBeFocused();

    await profile.click();
    await page.getByRole("link", { name: "Settings and Privacy" }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test("the top right icon switches between light and dark and keeps the choice", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const toggle = page.getByRole("button", { name: /^Switch to (light|dark) mode$/ });
    const before = (await toggle.getAttribute("aria-label")) ?? "";
    const expected = before.includes("dark") ? "dark" : "light";
    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", expected);
    // The choice is saved in a cookie. Wait for it, so the reload does not race the save.
    await expect
      .poll(async () => (await page.context().cookies()).find((cookie) => cookie.name === "vantage-theme")?.value)
      .toBe(expected);
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", expected);
    // Put it back for the other tests.
    const other = expected === "dark" ? "light" : "dark";
    await page.getByRole("button", { name: /^Switch to (light|dark) mode$/ }).click();
    await expect(html).toHaveAttribute("data-theme", other);
    await expect
      .poll(async () => (await page.context().cookies()).find((cookie) => cookie.name === "vantage-theme")?.value)
      .toBe(other);
  });
});
