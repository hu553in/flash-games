const CACHE_VERSION = "flash-games-v7";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./styles/main.css",
  "./scripts/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/icon.svg",
  "./icons/apple-touch-icon.png",
  "./assets/swf/MusicCatch2.swf",
  "./assets/swf/KingdomRush.swf",
  "./vendor/ruffle/ruffle.js",
  "./vendor/ruffle/core.ruffle.8700c6b0144208de9d1b.js",
  "./vendor/ruffle/core.ruffle.99037c3e46986c91597b.js",
  "./vendor/ruffle/2ff4ebe4b64161970b9a.wasm",
  "./vendor/ruffle/a92f6442b0f55013a937.wasm",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      await cache.addAll(CORE_ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => !name.startsWith(CACHE_VERSION))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "SKIP_WAITING") {
    return;
  }
  self.skipWaiting();
});

const cacheFirst = async (request) => {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response && (response.ok || response.type === "opaque")) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
  }
  return response;
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkFetch = (async () => {
    try {
      const response = await fetch(request);
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      return null;
    }
  })();

  if (cached) {
    return cached;
  }

  const networkResponse = await networkFetch;
  if (networkResponse) {
    return networkResponse;
  }
  throw new Error("Network request failed");
};

const networkFirstNavigation = async (request) => {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (_error) {
    const cachedRequest = await caches.match(request);
    if (cachedRequest) {
      return cachedRequest;
    }

    const cachedIndex = await caches.match("./index.html");
    if (cachedIndex) {
      return cachedIndex;
    }

    const offlineFallback = await caches.match("./offline.html");
    if (offlineFallback) {
      return offlineFallback;
    }
    throw _error;
  }
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.endsWith(".swf")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image" ||
    request.destination === "manifest"
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
