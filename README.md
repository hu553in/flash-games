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

- Bun for dependencies, builds, and checks
- Python for local serving and the offline check

## Setup

Install dependencies, build, and serve the site:

```bash
bun i
bun dev
```

Open <http://localhost:5173>. Restart `bun dev` after source changes to rebuild the site.

`bun run build` compiles the application and service worker with Bun and copies static assets to
`dist/`. Vercel runs this command and serves `dist/`.

## Usage

- Game choices are static `<option>` entries in `index.html`
- Game files live in `assets/swf`
- Add a new game file to `CORE_ASSETS` in `sw.ts` when it must be precached for first-load offline
  usage
- Bump `CACHE_VERSION` in `sw.ts` when core cached assets change

## Development

```bash
bun check
bun check:fix
bun check:types
bun check:offline
```

`bun check:types` checks application, tooling, and test types, with a separate WebWorker environment
for `sw.ts`.

`bun check:offline` installs Playwright Chromium, builds the site, starts its own static server for
`dist/` on port 4173, loads the app online, switches the browser context offline, and verifies the
cached app after a reload. Failure artifacts are written under `test-results/`.

## Updating Ruffle

Download the upstream `web-selfhosted` release and replace the runtime files and licenses in
`vendor/ruffle/`. Update `CORE_ASSETS` and increment `CACHE_VERSION` in `sw.ts` when the runtime
file names change. Keep `index.html` loading `./vendor/ruffle/ruffle.js`.

Run `bun check:offline` after every Ruffle or service-worker change.

## Project structure

```text
assets/
  swf/                -> Flash game files
icons/                -> PWA icons
scripts/              -> TypeScript application and browser API types
styles/               -> UI styles
tests/                -> Offline browser test
vendor/
  ruffle/             -> Self-hosted Ruffle runtime

index.html            -> Application entry point
manifest.webmanifest  -> PWA manifest
offline.html          -> Offline fallback page
playwright.config.ts  -> Browser test configuration
sw.ts                 -> Service worker, compiled to dist/sw.js
tsconfig.json         -> Application, tooling, and test type checks
tsconfig.worker.json  -> Service-worker type checks
```
