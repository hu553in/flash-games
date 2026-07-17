import { expect, test } from "@playwright/test";

test("keeps the player available offline", async ({ context, page }) => {
  const pageErrors = [];
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
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.locator("#connection")).toHaveText("Offline");
  await expect(page.locator("ruffle-player")).toBeAttached();
  await expect
    .poll(() => page.evaluate(() => Boolean(window.RufflePlayer)))
    .toBe(true);
  expect(pageErrors).toEqual([]);
});
