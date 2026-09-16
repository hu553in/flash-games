import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export const expectGameLoaded = async (page: Page) => {
  await expect
    .poll(() =>
      page
        .locator("ruffle-player")
        .evaluate((player: RufflePlayerElement) => player.ruffle().readyState)
    )
    .toBe(2);
};

export const goOffline = async (page: Page) => {
  // HTTP caching must not hide missing service-worker cache entries.
  const session = await page.context().newCDPSession(page);
  await session.send("Network.clearBrowserCache");
  await session.detach();
  await page.context().setOffline(true);
};
