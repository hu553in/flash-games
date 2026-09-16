import { expect, test } from "@playwright/test";

import { expectGameLoaded, goOffline } from "./helpers";

test("does not serve the app for an unknown URL", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller))
    )
    .toBe(true);

  const response = await page.goto("/missing/page");
  expect(response?.status()).toBe(404);
  await expect(page.locator("#selector")).toHaveCount(0);
});

test("keeps the player available offline", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#selector")).toBeVisible();
  await expect(page.locator("ruffle-player")).toBeAttached();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker?.controller))
    )
    .toBe(true);

  await goOffline(page);
  await expect(page.locator("#connection")).toHaveText("Offline");
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.locator("ruffle-player")).toBeAttached();
  await expectGameLoaded(page);

  const [gameResponse] = await Promise.all([
    page.waitForResponse("**/assets/swf/KingdomRush.swf"),
    page.locator("#selector").selectOption("KingdomRush"),
  ]);
  expect(gameResponse.ok()).toBe(true);
  expect(gameResponse.fromServiceWorker()).toBe(true);
  await expectGameLoaded(page);
  await expect(page).toHaveURL(/\?game=KingdomRush$/u);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#selector")).toHaveValue("KingdomRush");
  await expectGameLoaded(page);
  expect(pageErrors).toEqual([]);
});
