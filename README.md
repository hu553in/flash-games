# Flash games

[![CI](https://github.com/hu553in/flash-games/actions/workflows/ci.yml/badge.svg)](https://github.com/hu553in/flash-games/actions/workflows/ci.yml)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/flash-games-hu553in)](https://flash-games-hu553in.vercel.app/)

Static browser player for `.swf` games powered by self-hosted Ruffle. The app is installable as a
PWA and keeps the app shell, Ruffle runtime, and listed games available offline after the first
online load.

## What it does

- Runs bundled Flash games from `assets/swf` through the Ruffle runtime in `vendor/ruffle`
- Keeps the selected game in the `?game=` URL parameter
- Provides PWA metadata, install icons, an offline fallback page, and an install prompt
- Caches the app shell, game assets, and Ruffle files through `sw.js`
- Shows an in-app reload action when a new service worker is ready

## Requirements

- Bun for checks
- Python for local serving and the offline check

## Setup

Install dependencies and serve the repository root:

```bash
bun i
python3 -m http.server 5173
```

Open <http://localhost:5173>. There is no build step; Vercel serves the static files directly.

## Usage

- Game choices are static `<option>` entries in `index.html`
- Game files live in `assets/swf`
- Add a new game file to `CORE_ASSETS` in `sw.js` when it must be precached for first-load offline
  usage
- Bump `CACHE_VERSION` in `sw.js` when core cached assets change

## Development

```bash
bun check
bun check:fix
bun check:offline
```

`bun check:offline` installs Playwright Chromium, starts a local static server, loads the app
online, switches the browser context offline, and verifies the cached app after a reload. Failure
artifacts are written under `test-results/`.

## Updating Ruffle

Download the upstream `web-selfhosted` release and replace the runtime files and licenses in
`vendor/ruffle/`. Update `CORE_ASSETS` and increment `CACHE_VERSION` in `sw.js` when the runtime
file names change. Keep `index.html` loading `./vendor/ruffle/ruffle.js`.

Run `bun check:offline` after every Ruffle or service-worker change.

## Project structure

```text
assets/
  swf/                -> Flash game files
icons/                -> PWA icons
scripts/              -> Application logic
styles/               -> UI styles
tests/                -> Offline browser test
vendor/
  ruffle/             -> Self-hosted Ruffle runtime

index.html            -> Application entry point
manifest.webmanifest  -> PWA manifest
offline.html          -> Offline fallback page
playwright.config.js  -> Browser test configuration
sw.js                 -> Service worker
```
