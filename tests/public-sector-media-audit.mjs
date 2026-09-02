import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ensureServerAvailable,
  launchAuditBrowser,
  loadPlaywright,
} from "./helpers/public-layout-audit.mjs";

const baseUrl = `${(process.env.TOPINFO_QA_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "")}/`;
const outputPath = resolve(process.env.TOPINFO_QA_OUTPUT || "output/qa/sector-media-audit/report.json");
const outputDirectory = resolve(outputPath, "..");
const screenshotDirectory = resolve(outputDirectory, "screenshots");
const viewports = [
  { name: "390x844", width: 390, height: 844 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "2560x1440", width: 2560, height: 1440 },
];
const animatedPaths = [
  "/assets/sector/sector-cafe.webp",
  "/assets/sector/sector-bar.webp",
  "/assets/sector/feature-market-price.webp",
  "/assets/sector/beauty-reservation-register.webp",
  "/assets/sector/beauty-booking-talk.png",
];
const sectorCases = [
  { name: "cafe", title: "카페·베이커리", transitionTimeout: 8_500 },
  { name: "restaurant", title: "음식점", transitionTimeout: 9_000 },
  { name: "bar", title: "술집·바", transitionTimeout: 8_500 },
  { name: "retail", title: "도·소매업", transitionTimeout: 8_500 },
  { name: "beauty", title: "뷰티·서비스", transitionTimeout: 14_500 },
];

const pathname = (url) => {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

await ensureServerAvailable(baseUrl, 10_000);
await mkdir(screenshotDirectory, { recursive: true });
const playwrightInfo = await loadPlaywright();
const browser = await launchAuditBrowser(playwrightInfo);
const results = [];

try {
  for (const viewport of viewports) {
    for (const reducedMotion of viewport.width === 1440 ? ["no-preference", "reduce"] : ["no-preference"]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion,
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    const requests = [];
    page.on("request", (request) => requests.push(pathname(request.url())));

    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.locator("body").waitFor({ state: "visible" });
    await page.waitForTimeout(1_200);

    const initialAnimated = requests.filter((path) => animatedPaths.includes(path));
    const stage = page.locator(".top-home-sector__story").first();
    await stage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1_500);

    const afterScrollAnimated = requests.filter((path) => animatedPaths.includes(path));
    const activeImagePath = await page.locator(".top-home-sector__media-stage img").first()
      .getAttribute("src")
      .then((value) => value ? pathname(value) : null)
      .catch(() => null);

    const findings = [];
    if (initialAnimated.length > 0) {
      findings.push(`화면 밖 초기 animated WebP 요청: ${[...new Set(initialAnimated)].join(", ")}`);
    }
    if (reducedMotion === "no-preference" && !afterScrollAnimated.includes(animatedPaths[0])) {
      findings.push("업종 섹션 접근 후 대표 애니메이션이 요청되지 않음");
    }
    if (reducedMotion === "reduce" && afterScrollAnimated.length > 0) {
      findings.push(`모션 감소 환경에서 animated WebP 요청: ${[...new Set(afterScrollAnimated)].join(", ")}`);
    }

    const sectorResults = [];
    const tabs = page.locator(".top-home-sector__tabs button");
    const mobileSelect = page.locator(".top-home-sector__select select");
    for (const [index, sectorCase] of sectorCases.entries()) {
      if (viewport.width < 768) await mobileSelect.selectOption(String(index));
      else await tabs.nth(index).click();
      await page.waitForFunction((title) => (
        document.querySelector(".top-home-sector__summary h3")?.textContent?.trim() === title
      ), sectorCase.title, { timeout: 5_000 });
      await page.waitForFunction(() => {
        const first = document.querySelector(".top-home-sector__media-nav button");
        return first?.getAttribute("aria-pressed") === "true";
      }, undefined, { timeout: 5_000 });
      await page.waitForTimeout(350);

      let mediaStage = page.locator(".top-home-sector__media-stage:visible").last();
      const firstCaption = await page.locator(".top-home-sector__media figcaption strong").first().textContent();
      const firstPressedIndex = await page.locator(".top-home-sector__media-nav button").evaluateAll((buttons) => (
        buttons.findIndex((button) => button.getAttribute("aria-pressed") === "true")
      ));
      let nextPressedIndex = firstPressedIndex;

      if (reducedMotion === "no-preference") {
        if (viewport.width >= 768) await mediaStage.hover();
        await page.waitForFunction((previousIndex) => {
          const buttons = [...document.querySelectorAll(".top-home-sector__media-nav button")];
          return buttons.findIndex((button) => button.getAttribute("aria-pressed") === "true") !== previousIndex;
        }, firstPressedIndex, { timeout: sectorCase.transitionTimeout });
        nextPressedIndex = await page.locator(".top-home-sector__media-nav button").evaluateAll((buttons) => (
          buttons.findIndex((button) => button.getAttribute("aria-pressed") === "true")
        ));
        await page.waitForTimeout(350);
        mediaStage = page.locator(".top-home-sector__media-stage:visible").last();
      }

      await mediaStage.locator("img").first().waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
      const overflow = await mediaStage.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return [...element.querySelectorAll("img")]
          .filter((image) => {
            const style = getComputedStyle(image);
            return style.display !== "none" && style.visibility !== "hidden";
          })
          .map((image) => {
            const rect = image.getBoundingClientRect();
            return {
              src: image.getAttribute("src"),
              left: Math.max(0, bounds.left - rect.left),
              right: Math.max(0, rect.right - bounds.right),
              top: Math.max(0, bounds.top - rect.top),
              bottom: Math.max(0, rect.bottom - bounds.bottom),
            };
          })
          .filter((item) => Math.max(item.left, item.right, item.top, item.bottom) > 1);
      });

      if (reducedMotion === "no-preference" && nextPressedIndex === firstPressedIndex) {
        findings.push(`${sectorCase.title}: hover 상태에서 자동 장면 순환이 진행되지 않음`);
      }
      if (overflow.length > 0) {
        findings.push(`${sectorCase.title}: 미디어 스테이지 밖으로 이미지가 이탈함`);
      }

      const screenshot = resolve(screenshotDirectory, `${sectorCase.name}-${viewport.name}-${reducedMotion}.png`);
      await page.locator(".top-home-sector__story").first().screenshot({ path: screenshot, animations: "allow" });
      sectorResults.push({
        ...sectorCase,
        firstCaption: firstCaption?.trim() || null,
        firstPressedIndex,
        nextPressedIndex,
        overflow,
        screenshot,
      });
    }

    if (reducedMotion === "reduce") {
      const reducedAnimated = requests.filter((path) => animatedPaths.includes(path));
      if (reducedAnimated.length > 0) {
        findings.push(`모션 감소 업종 전환 중 animated WebP 요청: ${[...new Set(reducedAnimated)].join(", ")}`);
      }
    }

    results.push({
      viewport,
      reducedMotion,
      initialAnimated: [...new Set(initialAnimated)],
      afterScrollAnimated: [...new Set(afterScrollAnimated)],
      activeImagePath,
      sectorResults,
      findings,
    });
    await context.close();
    }
  }
} finally {
  await browser.close();
}

const report = {
  measuredAt: new Date().toISOString(),
  baseUrl,
  playwright: {
    version: playwrightInfo.version,
    source: playwrightInfo.source,
  },
  results,
  passed: results.every((result) => result.findings.length === 0),
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

if (!report.passed) process.exitCode = 1;
