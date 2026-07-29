import { expect, test } from "@playwright/test";

test.describe("private routes and auth surface", () => {
  test("dashboard, account and trip detail require a session", async ({ page }) => {
    for (const path of ["/dashboard", "/account", "/live", "/trips/some-trip-id"]) {
      await page.goto(path);
      await expect(page, `${path} hoort naar /auth te sturen`).toHaveURL(/\/auth/);
    }
  });

  test("auth page is noindex and offers both sign-in options", async ({ page }) => {
    await page.goto("/auth?next=/dashboard");

    await expect(page.getByRole("heading", { level: 1, name: "Bewaar je living trip." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Stuur veilige inloglink" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Doorgaan met Google" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});
