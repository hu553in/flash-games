import { expect, test } from "@playwright/test";

test("keeps the player available offline", async ({ context, page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#selector")).toBeVisible();
  await expect(page.locator("ruffle-player")).toBeAttached();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker?.controller))
    )
    .toBe(true);

  await context.setOffline(true);
  await expect(page.locator("#connection")).toHaveText("Offline");
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.locator("ruffle-player")).toBeAttached();
  await expect
    .poll(() => page.evaluate(() => Boolean(window.RufflePlayer)))
    .toBe(true);

  const [gameResponse] = await Promise.all([
    page.waitForResponse("**/assets/swf/KingdomRush.swf"),
    page.locator("#selector").selectOption("KingdomRush"),
  ]);
  expect(gameResponse.ok()).toBe(true);
  expect(gameResponse.fromServiceWorker()).toBe(true);
  await expect(page).toHaveURL(/\?game=KingdomRush$/u);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#selector")).toHaveValue("KingdomRush");
  expect(pageErrors).toEqual([]);
});
