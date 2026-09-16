import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildServiceWorker } from "./build-service-worker";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
const ruffleDirectory = path.dirname(
  fileURLToPath(import.meta.resolve("@ruffle-rs/ruffle"))
);
const runtimeFiles = readdirSync(ruffleDirectory)
  .filter((file) => file.endsWith(".js") || file.endsWith(".wasm"))
  .toSorted();

rmSync(output, { force: true, recursive: true });

execFileSync(
  process.execPath,
  [
    "build",
    "scripts/app.ts",
    "--root",
    ".",
    "--outdir",
    output,
    "--target",
    "browser",
  ],
  { cwd: root, stdio: "inherit" }
);

for (const asset of [
  "assets",
  "icons",
  "styles",
  "index.html",
  "manifest.webmanifest",
]) {
  cpSync(path.join(root, asset), path.join(output, asset), { recursive: true });
}

const ruffleOutput = path.join(output, "ruffle");
mkdirSync(ruffleOutput);
for (const file of [...runtimeFiles, "LICENSE_APACHE", "LICENSE_MIT"]) {
  cpSync(path.join(ruffleDirectory, file), path.join(ruffleOutput, file));
}

await buildServiceWorker(output);
