import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import { buildServiceWorker } from "../scripts/build-service-worker";
import { expectGameLoaded, goOffline } from "./helpers";

test("updates changed assets after Reload without downloading unchanged games", async ({
  context,
  page,
}) => {
  const output = fileURLToPath(new URL("../dist", import.meta.url));
  const entries = readdirSync(output).filter((entry) => entry !== "test-sites");
  const fixtures = path.join(output, "test-sites");
  mkdirSync(fixtures, { recursive: true });
  const directory = mkdtempSync(path.join(fixtures, "site-"));
  const url = `/test-sites/${path.basename(directory)}/`;

  try {
    for (const entry of entries) {
      cpSync(path.join(output, entry), path.join(directory, entry), {
        recursive: true,
      });
    }
    const retiredAsset = path.join(directory, "assets/retired.txt");
    writeFileSync(retiredAsset, "Retired asset");
    await buildServiceWorker(directory);

    const initialWorker = readFileSync(path.join(directory, "sw.js"), "utf-8");
    await buildServiceWorker(directory);
    expect(readFileSync(path.join(directory, "sw.js"), "utf-8")).toBe(
      initialWorker
    );

    await page.goto(`${url}?game=MusicCatch2`);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect
      .poll(() =>
        page.evaluate(() => Boolean(navigator.serviceWorker.controller))
      )
      .toBe(true);
    await expectGameLoaded(page);

    const otherPage = await context.newPage();
    await otherPage.bringToFront();
    await otherPage.goto(`${url}?game=KingdomRush`);
    await expect(otherPage.locator("#selector")).toHaveValue("KingdomRush");
    await expectGameLoaded(otherPage);

    await page.evaluate(async () => {
      await caches.open("flash-games-v8-shell");
      await caches.open("flash-games-v9-ruffle-0.6.0-runtime");
      await caches.open("unrelated-cache");
    });

    const downloads: string[] = [];
    context.on("request", (request) => {
      if (request.serviceWorker()) {
        downloads.push(new URL(request.url()).pathname);
      }
    });

    const stylesheet = path.join(directory, "styles/main.css");
    const addedAsset = path.join(directory, "assets/added.txt");
    const originalStylesheet = readFileSync(stylesheet, "utf-8");
    writeFileSync(
      stylesheet,
      `${originalStylesheet}\nbody { background-color: rgb(11, 22, 33); }\n`
    );
    writeFileSync(addedAsset, "New offline asset");
    rmSync(retiredAsset);
    await buildServiceWorker(directory);

    // An incomplete deployment must not replace the installed offline version.
    rmSync(addedAsset);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      const rejectedUpdate = new Promise<void>((resolve, reject) => {
        registration.addEventListener(
          "updatefound",
          () => {
            const incoming = registration.installing;
            if (!incoming) {
              reject(new Error("The update did not start installing"));
              return;
            }
            incoming.addEventListener("statechange", () => {
              if (incoming.state === "redundant") {
                resolve();
              } else if (incoming.state === "installed") {
                reject(new Error("The incomplete update was installed"));
              }
            });
          },
          { once: true }
        );
      });
      await registration.update();
      await rejectedUpdate;
    });
    await expect(page.getByRole("button", { name: "Reload" })).toBeHidden();
    await goOffline(page);
    expect(
      await page.evaluate(async () => {
        const response = await fetch("styles/main.css");
        return response.text();
      })
    ).toBe(originalStylesheet);
    expect(
      await page.evaluate(async () => {
        const response = await fetch("assets/retired.txt");
        return response.text();
      })
    ).toBe("Retired asset");
    await context.setOffline(false);
    writeFileSync(addedAsset, "New offline asset");

    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    });

    const reload = page.getByRole("button", { exact: true, name: "Reload" });
    await expect(reload).toBeVisible();
    const otherReload = otherPage.getByRole("button", {
      exact: true,
      name: "Reload",
    });
    await expect(otherReload).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS(
      "background-color",
      "rgb(11, 22, 33)"
    );
    await goOffline(page);
    await page.bringToFront();
    await Promise.all([page.waitForEvent("load"), reload.click()]);

    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(11, 22, 33)"
    );
    await expect(page.locator("#connection")).toHaveText("Offline");
    await expect(page).toHaveURL(/\?game=MusicCatch2$/u);
    await expectGameLoaded(page);
    expect(
      await page.evaluate(async () => {
        const response = await fetch("assets/added.txt");
        return response.text();
      })
    ).toBe("New offline asset");
    await expect
      .poll(() =>
        page.evaluate(async () =>
          Boolean(
            await caches.match(
              new URL("assets/retired.txt", location.href).href,
              { ignoreSearch: true }
            )
          )
        )
      )
      .toBe(false);
    await expect
      .poll(() => page.evaluate(() => caches.keys()))
      .not.toContain("flash-games-v8-shell");
    expect(await page.evaluate(() => caches.keys())).not.toContain(
      "flash-games-v9-ruffle-0.6.0-runtime"
    );
    expect(await page.evaluate(() => caches.keys())).toContain(
      "unrelated-cache"
    );
    expect(downloads).toContain(
      new URL("styles/main.css", page.url()).pathname
    );
    expect(downloads).toContain(
      new URL("assets/added.txt", page.url()).pathname
    );
    expect(
      downloads.filter(
        (pathname) => pathname.endsWith(".swf") || pathname.includes("/ruffle/")
      )
    ).toEqual([]);

    // Updating one tab must leave the other tab's Reload action usable.
    await expect(otherPage.locator("body")).not.toHaveCSS(
      "background-color",
      "rgb(11, 22, 33)"
    );
    await otherPage.bringToFront();
    await otherReload.click();
    await expect(otherPage.locator("body")).toHaveCSS(
      "background-color",
      "rgb(11, 22, 33)"
    );
    await expect(otherPage.locator("#selector")).toHaveValue("KingdomRush");
    await expectGameLoaded(otherPage);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});
