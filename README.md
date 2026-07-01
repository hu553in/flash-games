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

- Node.js and pnpm for checks
- `xmllint` for SVG checks; CI installs it through `libxml2-utils`
- Any static HTTP server for manual local testing

## Setup

Install dependencies and serve the repository root:

```bash
pnpm i
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
pnpm check
pnpm check:fix
pnpm verify:offline
```

`pnpm verify:offline` installs Playwright Chromium, starts a local static server, loads the app
online, switches the browser context offline, reloads the page, and writes
`output/verify-offline.png`.

## Updating Ruffle

Download a `web-selfhosted` build from
[github.com/ruffle-rs/ruffle/releases](https://github.com/ruffle-rs/ruffle/releases), replace
`vendor/ruffle/`, then update `CORE_ASSETS` in `sw.js` so the filenames match the new
`core.ruffle.*.js` and `*.wasm` files. Keep `index.html` loading `./vendor/ruffle/ruffle.js`.

Run `pnpm verify:offline` after every Ruffle or service-worker change.

## Project structure

```text
assets/
  swf/                -> Flash game files
icons/                -> PWA icons
scripts/              -> Application logic
styles/               -> UI styles
vendor/
  ruffle/             -> Self-hosted Ruffle runtime

index.html            -> Application entry point
manifest.webmanifest  -> PWA manifest
offline.html          -> Offline fallback page
sw.js                 -> Service worker
```
