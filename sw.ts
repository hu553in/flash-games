import { clientsClaim, setCacheNameDetails } from "workbox-core";
import type { PrecacheEntry } from "workbox-precaching";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: PrecacheEntry[];
};

setCacheNameDetails({ prefix: "flash-games" });
precacheAndRoute(self.__WB_MANIFEST, {
  // Query parameters select games in the browser; published files are static.
  ignoreURLParametersMatching: [/.*/u],
});
cleanupOutdatedCaches();
clientsClaim();

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  // Workbox does not own the caches created by the previous service worker.
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) =>
              name.startsWith("flash-games-v") &&
              (name.endsWith("-shell") || name.endsWith("-runtime"))
          )
          .map((name) => caches.delete(name))
      );
    })()
  );
});
