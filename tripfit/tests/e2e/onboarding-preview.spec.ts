import { expect, test } from "@playwright/test";

test.describe("anonymous living-trip flow", () => {
  test("opens the main multi-region trip before registration", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: "Stop searching. Open your trip." }),
    ).toBeVisible();

    await page.getByLabel("Regio of verblijfplaats").selectOption("do-santo-domingo");
    await page.getByLabel("Aankomstdatum").fill("2027-01-27");
    await page.getByLabel("Vertrekdatum").fill("2027-02-07");
    await page.getByRole("button", { name: "Volgende" }).click();

    await page.getByLabel("Volwassenen").selectOption("2");
    await page.getByLabel("Kinderen").selectOption("1");
    await page.getByLabel("Kind 1").selectOption("7");
    await page.getByRole("button", { name: "Volgende" }).click();

    for (const interest of [
      "Natuur",
      "Cultuur",
      "Strand",
      "Eten",
      "Wildlife",
      "Gezinsactiviteiten",
    ]) {
      await page.getByText(interest, { exact: true }).click();
    }
    await page.getByRole("button", { name: "Volgende" }).click();

    await page.getByRole("button", { name: "Voeg verblijfslocatie toe" }).click();
    await page.getByRole("button", { name: "Voeg verblijfslocatie toe" }).click();

    await page.locator("#stop-region-0").selectOption("do-santo-domingo");
    await page.locator("#stop-arrival-0").fill("2027-01-27");
    await page.locator("#stop-departure-0").fill("2027-01-30");

    await page.locator("#stop-region-1").selectOption("do-samana");
    await page.locator("#stop-arrival-1").fill("2027-01-30");
    await page.locator("#stop-departure-1").fill("2027-02-05");

    await page.locator("#stop-region-2").selectOption("do-punta-cana");
    await page.locator("#stop-arrival-2").fill("2027-02-05");
    await page.locator("#stop-departure-2").fill("2027-02-07");

    await page.getByRole("button", { name: "Open mijn reis" }).click();
    await expect(page).toHaveURL(/\/preview\?/);

    await expect(
      page.getByRole("heading", { level: 1, name: "Bouw eerst de sterke route" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Santo Domingo" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Samaná / Las Terrenas" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Punta Cana / Bávaro" })).toBeVisible();
    await expect(page.getByText("Indicatieve seeddata")).toBeVisible();
    await expect(page.getByRole("button", { name: "Maak account & bewaar" })).toBeDisabled();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("serves an indexable regional page with canonical metadata", async ({ page }) => {
    await page.goto("/dominicaanse-republiek/samana");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Laat zee en microklimaat de volgorde bepalen",
    );
    await expect(page.getByLabel("Broodkruimelpad")).toContainText(
      "Samaná / Las Terrenas",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://calortravel.nl/dominicaanse-republiek/samana",
    );
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    const robots = await page.evaluate(
      () => document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
    );
    expect(robots ?? "").not.toContain("noindex");
  });

  test("keeps a tampered preview private and recoverable", async ({ page }) => {
    await page.goto(
      "/preview?country=do&arrival=2027-01-27&departure=2027-02-07&adults=2" +
        "&interests=nature&stops=unknown-region~2027-01-27~2027-02-07~",
    );

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "We missen iets om deze reis persoonlijk te maken.",
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Vul mijn reis aan" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });
});
