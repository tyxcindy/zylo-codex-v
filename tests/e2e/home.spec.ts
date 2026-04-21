import { test, expect } from "@playwright/test";

test("homepage renders core brand copy", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "You save it. Zylo plans it." })).toBeVisible();
  await expect(page.getByText("Turn saved reels, posts, screenshots, and food finds")).toBeVisible();
});
