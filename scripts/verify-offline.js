const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");

const rootDir = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 5173);
const host = "127.0.0.1";
const baseUrl = `http://${host}:${port}`;
const outputDir = path.join(rootDir, "output");
const screenshotPath = path.join(outputDir, "verify-offline.png");

const mimeByExtension = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".swf": "application/x-shockwave-flash"
};

function resolveFilePath(pathname) {
  let normalizedPath = decodeURIComponent(pathname);
  if (normalizedPath.endsWith("/")) normalizedPath += "index.html";
  const cleanedPath = path.posix.normalize(normalizedPath).replace(/^(\.\.\/)+/, "");
  const absolutePath = path.join(rootDir, cleanedPath);
  if (!absolutePath.startsWith(rootDir)) return null;
  return absolutePath;
}

function createStaticServer() {
  return http.createServer((req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end("Bad Request");
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end("Method Not Allowed");
      return;
    }

    const requestUrl = new URL(req.url, baseUrl);
    const absolutePath = resolveFilePath(requestUrl.pathname);
    if (!absolutePath) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.stat(absolutePath, (statError, stat) => {
      if (statError || !stat.isFile()) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      const contentType = mimeByExtension[path.extname(absolutePath)] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType, "Content-Length": stat.size });

      if (req.method === "HEAD") {
        res.end();
        return;
      }

      const stream = fs.createReadStream(absolutePath);
      stream.on("error", () => {
        if (!res.headersSent) res.writeHead(500);
        res.end("Internal Server Error");
      });
      stream.pipe(res);
    });
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function closeServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

async function runVerification() {
  const server = createStaticServer();
  let browser = null;

  const errors = [];

  try {
    await listen(server);

    browser = await chromium.launch({
      headless: true,
      args: ["--use-gl=angle", "--use-angle=swiftshader"]
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(String(error)));

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return;
      try {
        await navigator.serviceWorker.ready;
      } catch (_error) {
        // No-op: readiness check is best-effort.
      }
    });

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const state = await page.evaluate(() => {
      const badge = document.querySelector("#connection");
      return {
        hasSelector: Boolean(document.querySelector("#selector")),
        badgeText: badge ? badge.textContent.trim() : null,
        hasRuffle: Boolean(window.RufflePlayer),
        hasPlayerElement: Boolean(document.querySelector("ruffle-player")),
        hasServiceWorkerController: Boolean(navigator.serviceWorker && navigator.serviceWorker.controller),
        location: window.location.href
      };
    });

    fs.mkdirSync(outputDir, { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const ok =
      state.hasSelector &&
      state.badgeText === "Offline" &&
      state.hasRuffle &&
      state.hasPlayerElement &&
      state.hasServiceWorkerController &&
      errors.length === 0;

    console.log(
      JSON.stringify(
        {
          ok,
          state,
          errors,
          screenshot: path.relative(rootDir, screenshotPath)
        },
        null,
        2
      )
    );

    if (!ok) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await closeServer(server);
  }
}

runVerification().catch((error) => {
  console.error("verify:offline failed:", error);
  process.exit(1);
});
