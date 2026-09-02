import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ensureServerAvailable,
  launchAuditBrowser,
  loadPlaywright,
} from "./helpers/public-layout-audit.mjs";

const baseUrl = `${(process.env.TOPINFO_PERF_BASE_URL || "http://127.0.0.1:4173").replace(/\/+$/, "")}/`;
const outputPath = resolve(process.env.TOPINFO_PERF_OUTPUT || "output/qa/release-candidate-performance.json");
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

await ensureServerAvailable(baseUrl, 10_000);
const playwrightInfo = await loadPlaywright();
const browser = await launchAuditBrowser(playwrightInfo);
const results = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
      serviceWorkers: "block",
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      window.__topinfoVitals = { cls: 0, lcp: 0, eventDurations: [] };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__topinfoVitals.lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__topinfoVitals.cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) window.__topinfoVitals.eventDurations.push(entry.duration);
        }).observe({ type: "event", buffered: true, durationThreshold: 16 });
      } catch {
        // Event Timing is optional; LCP/CLS/FCP remain available.
      }
    });

    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.locator("body").waitFor({ state: "visible" });
    await page.waitForTimeout(2_000);
    const menuButton = page.locator('[aria-label*="메뉴"], .public-mobile-menu-button').first();
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
      await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(500);

    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0];
      const resources = performance.getEntriesByType("resource");
      const paints = performance.getEntriesByType("paint");
      const fcp = paints.find((entry) => entry.name === "first-contentful-paint")?.startTime || 0;
      const transferBytes = resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
      const decodedBodyBytes = resources.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), 0);
      const maximumEventDuration = Math.max(0, ...window.__topinfoVitals.eventDurations);

      return {
        responseEndMs: navigation?.responseEnd || 0,
        domContentLoadedMs: navigation?.domContentLoadedEventEnd || 0,
        loadEventMs: navigation?.loadEventEnd || 0,
        firstContentfulPaintMs: fcp,
        largestContentfulPaintMs: window.__topinfoVitals.lcp,
        cumulativeLayoutShift: window.__topinfoVitals.cls,
        syntheticMaximumEventDurationMs: maximumEventDuration,
        transferBytes,
        decodedBodyBytes,
        resourceCount: resources.length,
      };
    });

    results.push({ viewport, metrics });
    await context.close();
  }
} finally {
  await browser.close();
}

const report = {
  measuredAt: new Date().toISOString(),
  baseUrl,
  environment: "local production preview; not field data",
  caveat: "Synthetic event duration is not field INP and must not be reported as a real-user Core Web Vital.",
  playwright: {
    version: playwrightInfo.version,
    source: playwrightInfo.source,
  },
  results,
};

await mkdir(resolve(outputPath, ".."), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
