# Flash Games

[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/flash-games-hu553in)](https://flash-games-hu553in.vercel.app/)

Flash game player powered by **Ruffle** with full **Progressive Web App (PWA)** support.
Allows running `.swf` games in a browser and installing them as an offline-capable app.

---

## Features

### PWA

- Installable application (`manifest.webmanifest`)
- Offline support via service worker (`sw.js`)
- Offline fallback page (`offline.html`)
- In-app update prompt when a new version is available
- Home screen icons (`icons/*`)

### Performance & architecture

- App shell caching
- Game asset caching
- Self-hosted Ruffle runtime (no CDN dependency)
- Code split:
  - `styles/main.css`
  - `scripts/app.js`

---

## Local development

Run any static HTTP server.

Example:

```bash
python3 -m http.server 5173
```

Open:

```
http://localhost:5173
```

---

## Offline verification

Project includes an automated offline test using Playwright.

```bash
pnpm i
pnpm verify:offline
```

The test:

1. Loads the app online
2. Reloads it in offline mode
3. Fails if the app shell is not served from cache

---

## Updating Ruffle (self-hosted)

### 1. Download Ruffle

Download `web-selfhosted` from:

https://github.com/ruffle-rs/ruffle/releases

---

### 2. Replace runtime files

Extract archive and replace files inside:

```
vendor/ruffle/
```

Expected files:

- `ruffle.js`
- `core.ruffle.*.js`
- `*.wasm`

---

### 3. Update service worker

Edit `sw.js`:

- Increase `CACHE_VERSION`
- Update filenames in `CORE_ASSETS` so they exactly match new Ruffle build

---

### 4. Verify loader path

Ensure `index.html` still loads:

```
./vendor/ruffle/ruffle.js
```

---

### 5. Validate build

```bash
pnpm i
pnpm verify:offline
```

If verification passes — the update is safe.

---

## How offline works

- First online visit populates the cache
- Afterwards the app shell and cached games are available offline
- Service worker automatically updates cached assets after new deployment

---

## Project Structure

```
assets/
  swf/                → Flash game files

vendor/
  ruffle/             → Self-hosted Ruffle runtime

scripts/              → Application logic
styles/               → UI styles
icons/                → PWA icons

index.html            → App entry point
sw.js                 → Service worker
manifest.webmanifest  → PWA manifest
offline.html          → Offline fallback page
```
