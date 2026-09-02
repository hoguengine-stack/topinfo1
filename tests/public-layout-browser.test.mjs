import assert from "node:assert/strict";
import test from "node:test";
import {
  auditDisclosureInteractions,
  auditFixedCtaOverlap,
  auditRenderedPage,
  ensureServerAvailable,
  formatFindings,
  launchAuditBrowser,
  loadPlaywright,
  preparePublicPage,
  resolveAuditConfig,
} from "./helpers/public-layout-audit.mjs";

// Full audit: node --test tests/public-layout-browser.test.mjs
// Scoped audit example:
// $env:TOPINFO_AUDIT_ROUTES='home,products'; $env:TOPINFO_AUDIT_VIEWPORTS='390,1440'
// node --test tests/public-layout-browser.test.mjs
const config = resolveAuditConfig();

test("TOPINFO public browser and responsive quality audit", { timeout: 10 * 60 * 1000 }, async (suite) => {
  let playwrightInfo;
  let browser;

  await suite.test("preflight: local server, Playwright, and Chromium", async () => {
    await ensureServerAvailable(config.baseUrl);
    playwrightInfo = await loadPlaywright();
    browser = await launchAuditBrowser(playwrightInfo);
    assert.ok(browser, "Playwright returned no browser instance.");
  });

  if (!browser) return;

  try {
    for (const viewport of config.viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: "reduce",
        locale: "ko-KR",
        colorScheme: "light",
      });
      const page = await context.newPage();

      try {
        for (const route of config.routes) {
          await suite.test(`${route.name} @ ${viewport.name}`, async () => {
            const url = new URL(route.path, config.baseUrl).href;
            await preparePublicPage(page, url, config.navigationTimeoutMs);

            const findings = [
              ...(await auditRenderedPage(page, viewport)),
              ...(route.name === "home" ? await auditDisclosureInteractions(page, viewport) : []),
              ...(await auditFixedCtaOverlap(page, viewport)),
            ];

            assert.equal(
              findings.length,
              0,
              formatFindings(findings, `${route.name} ${viewport.name}`, config.maxFindingsPerPage),
            );
          });
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
});
