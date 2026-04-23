import { expect, test } from "@playwright/test";

test("import workbench shows a success state after a mocked import", async ({ page }) => {
  await page.route("**/api/imports", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        job: {
          extractedPlaces: 2
        }
      })
    });
  });

  await page.goto("/test/import-harness");
  await page.getByRole("button", { name: /paste text/i }).click();
  await page.getByPlaceholder("Paste a caption, blog excerpt, or your own saved notes.").fill(
    "Kyoto food guide: Men-ya Inoichi and % Arabica Kyoto Higashiyama."
  );
  await page.getByPlaceholder(/Destination hint/).fill("Kyoto");
  await page.getByRole("button", { name: /send to zylo/i }).click();

  await expect(page.getByText(/Imported 2 place\(s\) and saved the job/i)).toBeVisible();
});

test("import workbench shows API failures in the UI", async ({ page }) => {
  await page.route("**/api/imports", async (route) => {
    await route.fulfill({
      status: 422,
      contentType: "application/json",
      body: JSON.stringify({
        error: "That import does not look travel-related enough to turn into saved places."
      })
    });
  });

  await page.goto("/test/import-harness");
  await page.getByPlaceholder(/Instagram\.com\/reel/).fill("https://www.instagram.com/reel/test");
  await page.getByRole("button", { name: /send to zylo/i }).click();

  await expect(
    page.getByText(/That import does not look travel-related enough to turn into saved places/i)
  ).toBeVisible();
});
