import { expect, test, type Page } from "@playwright/test";

function signUpEmail(page: Page) {
  return page.getByPlaceholder("Email address").nth(1);
}

function signUpPassword(page: Page) {
  return page.getByPlaceholder("Password").nth(1);
}

test("sign-up shows the API duplicate-email error", async ({ page }) => {
  await page.route("**/api/auth/sign-up", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        error: "This email is already registered. Sign in instead or reset your password."
      })
    });
  });

  await page.goto("/sign-in");
  await page.getByPlaceholder("Display name").fill("Cindy");
  await signUpEmail(page).fill("cindy@example.com");
  await signUpPassword(page).fill("StrongPassword123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText("This email is already registered. Sign in instead or reset your password.")
  ).toBeVisible();
});

test("sign-up success shows confirmation and clears the form", async ({ page }) => {
  await page.route("**/api/auth/sign-up", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Account created. Check your email to verify your address before signing in."
      })
    });
  });

  await page.goto("/sign-in");
  await page.getByPlaceholder("Display name").fill("Cindy");
  await signUpEmail(page).fill("new@example.com");
  await signUpPassword(page).fill("StrongPassword123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByText("Account created. Check your email to verify your address before signing in.")
  ).toBeVisible();
  await expect(page.getByPlaceholder("Display name")).toHaveValue("");
  await expect(signUpEmail(page)).toHaveValue("");
  await expect(signUpPassword(page)).toHaveValue("");
});
