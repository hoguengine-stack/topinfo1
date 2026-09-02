import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import {
  auditFixedCtaOverlap,
  auditRenderedPage,
  ensureServerAvailable,
  launchAuditBrowser,
  loadPlaywright,
  preparePublicPage,
} from "./helpers/public-layout-audit.mjs";

const PHYSICAL_VIEWPORT = { width: 1440, height: 900 };
const ZOOM_LEVELS = [1.25, 1.5];
const ROUTES = [
  { name: "home", path: "/" },
  { name: "toss-pos", path: "/toss-pos/" },
  { name: "uplus-ai-phone", path: "/uplus-ai-phone/" },
  { name: "products", path: "/products/" },
  { name: "industries", path: "/industries/" },
  { name: "promotion-pos", path: "/promotion/pos/" },
  { name: "used-pos", path: "/promotion/used-pos/" },
  { name: "support", path: "/support/" },
  { name: "resources", path: "/support/resources/" },
  { name: "suggestions", path: "/support/suggestions/" },
  { name: "consultation", path: "/contact/" },
  { name: "paper-request", path: "/support/paper/" },
];

const baseUrl = `${(process.env.TOPINFO_BASE_URL || "http://localhost:3000").replace(/\/+$/, "")}/`;
const outputDirectory = resolve(process.env.TOPINFO_ZOOM_OUTPUT || "output/qa/zoom-audit");
const requestedRoutes = new Set(
  (process.env.TOPINFO_ZOOM_ROUTES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const routes = requestedRoutes.size
  ? ROUTES.filter((route) => requestedRoutes.has(route.name) || requestedRoutes.has(route.path))
  : ROUTES;

if (routes.length === 0) {
  throw new Error("TOPINFO_ZOOM_ROUTES did not match a public route.");
}

async function settleBoard(page, route) {
  if (!["resources", "suggestions"].includes(route.name)) return;
  await page.waitForFunction(() => {
    const board = document.querySelector(".public-board");
    return Boolean(board && !board.textContent?.includes("불러오는 중입니다."));
  }, undefined, { timeout: 10_000 });
}

async function settleLazyMedia(page, viewport) {
  await page.evaluate(async ({ viewportHeight }) => {
    const delay = (milliseconds) => new Promise((resolveDelay) => window.setTimeout(resolveDelay, milliseconds));
    const maximum = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    const step = Math.max(320, Math.floor(viewportHeight * 0.8));
    for (let y = 0; y <= maximum; y += step) {
      window.scrollTo(0, Math.min(y, maximum));
      await delay(45);
    }
    window.scrollTo(0, maximum);
    await delay(100);
    window.scrollTo(0, 0);
  }, { viewportHeight: viewport.height });

  await page.evaluate(async () => {
    const pending = [...document.images].filter((image) => !image.complete);
    await Promise.race([
      Promise.all(pending.map((image) => new Promise((resolveImage) => {
        const done = () => resolveImage();
        image.addEventListener("load", done, { once: true });
        image.addEventListener("error", done, { once: true });
      }))),
      new Promise((resolveTimeout) => window.setTimeout(resolveTimeout, 4_000)),
    ]);
  });
}

function dedupe(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = `${finding.code}|${finding.selector}|${JSON.stringify(finding.details || {})}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function filterNativeDisclosureFindings(page, findings) {
  const filtered = [];
  for (const finding of findings) {
    if (finding.code === "ARIA_DISCLOSURE_STATE") {
      try {
        const element = page.locator(finding.selector).first();
        if (await element.count() > 0 && await element.evaluate((node) => node.matches("details > summary"))) continue;
      } catch {
        // Keep findings whose target cannot be inspected.
      }
    }
    filtered.push(finding);
  }
  return filtered;
}

await ensureServerAvailable(baseUrl);
const playwrightInfo = await loadPlaywright();
const browser = await launchAuditBrowser(playwrightInfo);
const results = [];

try {
  await mkdir(resolve(outputDirectory, "screenshots"), { recursive: true });

  for (const zoom of ZOOM_LEVELS) {
    const viewport = {
      width: Math.floor(PHYSICAL_VIEWPORT.width / zoom),
      height: Math.floor(PHYSICAL_VIEWPORT.height / zoom),
    };
    const context = await browser.newContext({ viewport, deviceScaleFactor: zoom });

    try {
      for (const route of routes) {
        const page = await context.newPage();
        let findings = [];
        let error = null;
        const zoomLabel = `${Math.round(zoom * 100)}pct`;
        const screenshotPath = resolve(outputDirectory, "screenshots", `${route.name}-${zoomLabel}.png`);

        try {
          await preparePublicPage(page, new URL(route.path, baseUrl).href, 25_000);
          await settleBoard(page, route);
          await settleLazyMedia(page, viewport);
          findings.push(...await filterNativeDisclosureFindings(page, await auditRenderedPage(page, viewport)));
          findings.push(...await auditFixedCtaOverlap(page, viewport));
          findings = dedupe(findings);
          await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
        } catch (pageError) {
          error = pageError?.message || String(pageError);
          findings.push({
            severity: "P1",
            code: "ZOOM_AUDIT_ERROR",
            message: error,
            selector: "document",
            details: {},
          });
        } finally {
          await page.close();
        }

        results.push({
          route: route.name,
          path: route.path,
          zoom: zoomLabel,
          physicalViewport: PHYSICAL_VIEWPORT,
          cssViewport: viewport,
          deviceScaleFactor: zoom,
          screenshot: screenshotPath,
          error,
          findings,
        });
        console.log(`${findings.length === 0 ? "PASS" : "FINDINGS"} ${route.name.padEnd(16)} ${zoomLabel} P1:${findings.filter((finding) => finding.severity === "P1").length}`);
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

const summary = {
  cases: results.length,
  casesWithFindings: results.filter((result) => result.findings.length > 0).length,
  P1: results.flatMap((result) => result.findings).filter((finding) => finding.severity === "P1").length,
};
const report = {
  measuredAt: new Date().toISOString(),
  baseUrl,
  method: "1440x900 physical viewport approximated with a reduced CSS viewport and matching deviceScaleFactor",
  playwright: { version: playwrightInfo.version, source: playwrightInfo.source },
  summary,
  results,
};
await writeFile(resolve(outputDirectory, "public-zoom-audit-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Summary: ${summary.cases} cases, P1:${summary.P1}`);

if (summary.P1 > 0) process.exitCode = 1;
