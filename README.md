# Flash games

[![CI](https://github.com/hu553in/flash-games/actions/workflows/ci.yml/badge.svg)](https://github.com/hu553in/flash-games/actions/workflows/ci.yml)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/flash-games-hu553in)](https://flash-games-hu553in.vercel.app/)

Static browser player for `.swf` games powered by self-hosted Ruffle. The app is installable as a
PWA and keeps the app shell, Ruffle runtime, and listed games available offline after the first
online load.

## What it does

- Runs bundled Flash games from `assets/swf` through the Ruffle runtime
- Keeps the selected game in the `?game=` URL parameter
- Provides PWA metadata, install icons, and an install prompt
- Caches the app shell, Ruffle runtime, and game assets through `sw.js`
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
`dist/`. It copies Ruffle from `@ruffle-rs/ruffle`, including its licenses, then generates the
Workbox precache manifest from the published files and their content hashes. Vercel runs this
command and serves `dist/`.

## Usage

- Game choices are static `<option>` entries in `index.html`
- Game files live in `assets/swf`
- Published assets are precached automatically; no file lists or cache versions need manual updates

Renovate updates Ruffle through `package.json` and `bun.lock`. Workbox updates changed assets and
removes obsolete cache entries while reusing unchanged files. A new service worker waits for the
in-app `Reload` action before taking over open pages. Other tabs keep running their current game
until reloaded.

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
`dist/` on port 4173, loads the app once online, clears the browser's HTTP cache, and verifies both
games load offline through the service worker. It also checks failed updates, new and removed
assets, `Reload` across tabs, and reuse of unchanged games and Ruffle files. Failure artifacts are
written under `test-results/`.

## Project structure

```text
assets/
  swf/                -> Flash game files
icons/                -> PWA icons
scripts/              -> Build script, TypeScript application, and browser API types
styles/               -> UI styles
tests/                -> Offline and update browser tests

index.html            -> Application entry point
manifest.webmanifest  -> PWA manifest
playwright.config.ts  -> Browser test configuration
sw.ts                 -> Service worker, compiled to dist/sw.js
tsconfig.json         -> Application, tooling, and test type checks
tsconfig.worker.json  -> Service-worker type checks
```
