import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getManifest } from "workbox-build";

export const buildServiceWorker = async (directory: string) => {
  const { manifestEntries, warnings } = await getManifest({
    globDirectory: directory,
    globIgnores: ["sw.js", "ruffle/LICENSE_*"],
    globPatterns: ["**/*"],
    // Every published asset is available offline, including large SWFs and WASM.
    maximumFileSizeToCacheInBytes: Number.MAX_SAFE_INTEGER,
  });
  if (warnings.length > 0) {
    throw new Error(
      `Could not generate the precache manifest: ${warnings.join("; ")}`
    );
  }

  const workboxLicense = readFileSync(
    fileURLToPath(import.meta.resolve("workbox-core/LICENSE")),
    "utf-8"
  );

  // Knip mistakes an inline "bun build" command for the package's build script.
  const buildArguments = [
    "build",
    "sw.ts",
    "--outfile",
    path.join(directory, "sw.js"),
    "--target",
    "browser",
    "--minify",
    "--banner",
    `/*! Workbox\n${workboxLicense}*/`,
    "--define",
    `self.__WB_MANIFEST=${JSON.stringify(manifestEntries)}`,
    "--define",
    'process.env.NODE_ENV="production"',
  ];
  execFileSync("bun", buildArguments, {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    stdio: "inherit",
  });
};
