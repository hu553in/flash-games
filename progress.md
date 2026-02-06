Original prompt: make it a full-featured PWA

## 2026-02-06

- Reviewed project structure (`index.html`, `README.md`, `assets/swf/MusicCatch2.swf`).
- Confirmed there is no existing PWA setup (no manifest, no service worker, no icons, no offline fallback).
- Next: add complete PWA shell and validate in browser automation.

- Added full PWA surface:
  - `manifest.webmanifest` with standalone display, icons, shortcut, and app metadata.
  - `sw.js` with install/activate lifecycle, cache versioning, runtime strategies, and update messaging.
  - `offline.html` fallback document.
  - `icons/icon.svg` plus generated PNG icons (`192`, `512`, `512-maskable`, `apple-touch-icon`).
- Updated `index.html`:
  - Manifest + mobile meta tags and icons.
  - Install button flow (`beforeinstallprompt`, `appinstalled`).
  - Service worker registration and update prompt.
  - Online/offline network badge and URL query sync for selected game.
- Updated `README.md` with PWA behavior and local run instructions.
- Next: run local server + Playwright validation loop and fix any runtime issues.

- Validation loop completed with `develop-web-game` Playwright client against `http://localhost:5173`:
  - Installed local Playwright dependency and Chromium for the skill script.
  - Captured `output/web-game/pwa-check/shot-0.png` and `output/web-game/pwa-check/shot-1.png`.
  - Manual screenshot check confirms app shell loads with game selector and online status badge.
  - No `errors-*.json` logs generated (no captured console/page errors during run).
- Remaining TODO for future iteration:
  - If strict offline for first load is required, self-host Ruffle script instead of CDN.

- Self-hosted latest Ruffle nightly from `~/Downloads/ruffle-nightly-2026_02_05-web-selfhosted`:
  - Copied runtime files into `vendor/ruffle/`:
    - `ruffle.js`
    - `core.ruffle.aa168e338c932fadbc73.js`
    - `core.ruffle.0a77bb1c50674a76cdaf.js`
    - `7a32b51c265ec1729e84.wasm`
    - `f7286edaae77ab5917b5.wasm`
  - Switched `index.html` script source from CDN to local `./vendor/ruffle/ruffle.js`.
  - Updated `sw.js` cache version and precache list to include all self-hosted Ruffle runtime files.
  - Updated fetch strategy for same-origin assets to `cacheFirst` to make precached runtime consistently available offline.

- Switched to local self-hosted Ruffle and validated:
  - `index.html` now loads `./vendor/ruffle/ruffle.js` (no CDN dependency).
  - `sw.js` bumped to `flash-games-v2` and precaches local Ruffle runtime/chunks/wasm files.
  - Fixed SW controller reload behavior to avoid forced reload on first install; reload now happens only after explicit update action.
  - Playwright run (`output/web-game/pwa-selfhosted`) completed with no captured console/page errors.
  - Visual output now shows the Ruffle splash/play screen from local runtime (self-hosted path works).

- Refactored app shell structure:
  - Moved inline CSS from `index.html` into `styles/main.css`.
  - Moved inline JS from `index.html` into `scripts/app.js` (loaded with `defer`).
  - Updated `sw.js` to `flash-games-v3` and added `styles/main.css` + `scripts/app.js` to `CORE_ASSETS` precache list for offline safety.
  - Updated README to mention code split and offline precache coverage.

- Post-refactor validation:
  - Playwright run on `output/web-game/pwa-refactor` passed with no captured errors.
  - Additional offline reload test passed in the same browser context:
    - online load -> set offline -> reload
    - app shell stayed available, connection badge switched to `Offline`, and `window.RufflePlayer` + `ruffle-player` remained present.

- Added repeatable offline verification command:
  - Created `package.json` with script `verify:offline`.
  - Added `scripts/verify-offline.js`:
    - Starts a local static server from project root.
    - Runs Playwright flow: online load -> wait for SW -> force offline -> reload.
    - Asserts cached app shell state (`Offline` badge, selector, Ruffle/player presence, SW control).
    - Saves screenshot to `output/verify-offline.png`.
    - Exits non-zero if checks fail.
  - Updated README with `npm run verify:offline` usage.
  - Updated `.gitignore` to ignore `node_modules/` (and keep `output/` ignored).

- Error handling/message consistency pass in `scripts/app.js`:
  - Replaced ad-hoc logger with unified `reportError(context, error, toastMessage?)`.
  - Kept technical diagnostics in console for non-user-actionable events (`unhandled error`, `unhandled rejection`, cleanup failures).
  - Added user-facing toast messages (with consistent sentence punctuation) for actionable failures:
    - game load failure -> `Could not load the game. Please try again.`
    - install prompt failure -> `Could not install the app.`
    - service worker registration failure -> `Offline features are unavailable.`
  - Kept existing informational/action toasts (`Flash Games installed.`, `Update available.` + `Reload`).
- Re-ran `npm run verify:offline` after the changes: passed (`ok: true`, no console/page errors captured).

- Added Ruffle update playbook to `README.md`:
  - Source of updates: GitHub releases page (`web-selfhosted` asset).
  - Replace files in `vendor/ruffle/`.
  - Update hashed `./vendor/ruffle/...` entries and `CACHE_VERSION` in `sw.js`.
  - Re-check `index.html` Ruffle script path.
  - Final validation via `npm run verify:offline`.

- Update toast interaction polish in `scripts/app.js` + `styles/main.css`:
  - `showToast(...)` now supports optional non-auto-hide mode and lets action callbacks keep the toast visible.
  - Service-worker `Update available` toast now disables the action button immediately on click, changes label to `Updating...`, and keeps the toast visible until controller handoff reload.
  - Added `.toast button:disabled` styling for a clear in-progress visual state.
  - Re-ran `pnpm verify:offline`: passed (`ok: true`, no console/page errors captured).

- Fix SW update toast race in `scripts/app.js`:
  - In the `Reload` action callback, capture and re-check `registration.waiting` at click time before disabling the button.
  - If no waiting worker exists anymore (stale toast/race), return `true` to hide toast and avoid a null `postMessage` failure.

- Bump service-worker cache version in `sw.js`:
  - Updated `CACHE_VERSION` from `flash-games-v5` to `flash-games-v6` so clients pick up the latest `scripts/app.js`/`styles/main.css` changes under cache-first strategy.
