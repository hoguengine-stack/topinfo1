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

const VIEWPORTS = [
  { name: "320x800", width: 320, height: 800 },
  { name: "360x800", width: 360, height: 800 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "820x1180", width: 820, height: 1180 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "2560x1440", width: 2560, height: 1440 },
];

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

const ROOT_SELECTOR = ".public-site.public-v3";
const DEFAULT_OUTPUT = "output/qa";
const DEFAULT_TIMEOUT_MS = 25_000;
const SEVERITY_ORDER = { P0: 0, P1: 1, P2: 2, INFO: 3 };

function splitList(value) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) || [];
}

function readFlag(name) {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function readBoolean(value, fallback) {
  if (value === undefined) return fallback;
  return !["0", "false", "no", "off"].includes(value.toLowerCase());
}

function normalizeBaseUrl(value) {
  return `${value.replace(/\/+$/, "")}/`;
}

function selectRoutes(requested) {
  if (requested.length === 0) return ROUTES;
  return requested.map((entry) => {
    const route = ROUTES.find((candidate) => candidate.name === entry || candidate.path === entry);
    if (route) return route;
    if (!entry.startsWith("/")) {
      throw new Error(`Unknown route '${entry}'. Use: ${ROUTES.map((routeItem) => routeItem.name).join(", ")}.`);
    }
    return {
      name: entry.replace(/[^a-zA-Z0-9가-힣]+/g, "-").replace(/^-|-$/g, "") || "custom",
      path: entry,
    };
  });
}

function selectViewports(requested) {
  if (requested.length === 0) return VIEWPORTS;
  const widths = new Set(requested.map((entry) => Number.parseInt(entry, 10)));
  const selected = VIEWPORTS.filter((viewport) => widths.has(viewport.width));
  if (selected.length !== widths.size) {
    const unknown = [...widths].filter((width) => !VIEWPORTS.some((viewport) => viewport.width === width));
    throw new Error(`Unsupported viewport width: ${unknown.join(", ")}. Use: ${VIEWPORTS.map((viewport) => viewport.width).join(", ")}.`);
  }
  return selected;
}

function resolveConfig() {
  if (process.argv.includes("--help")) {
    console.log(`TOPINFO public browser QA\n\n`
      + `node tests/public-browser-qa.mjs [options]\n\n`
      + `--base-url=http://localhost:3000\n`
      + `--routes=home,toss-pos,uplus-ai-phone,products,industries,promotion-pos,used-pos,support,resources,suggestions,consultation,paper-request\n`
      + `--viewports=390,1440,2560\n`
      + `--output=output/qa\n`
      + `--screenshots=true|false\n`
      + `--fail-on=P0|P1|P2|none\n\n`
      + `Equivalent environment variables use TOPINFO_QA_BASE_URL, TOPINFO_QA_ROUTES, `
      + `TOPINFO_QA_VIEWPORTS, TOPINFO_QA_OUTPUT, TOPINFO_QA_SCREENSHOTS, and TOPINFO_QA_FAIL_ON.`);
    process.exit(0);
  }

  const routeList = splitList(readFlag("routes") || process.env.TOPINFO_QA_ROUTES);
  const viewportList = splitList(readFlag("viewports") || process.env.TOPINFO_QA_VIEWPORTS);
  const failOn = (readFlag("fail-on") || process.env.TOPINFO_QA_FAIL_ON || "P1").toUpperCase();
  if (!["P0", "P1", "P2", "NONE"].includes(failOn)) {
    throw new Error("--fail-on must be P0, P1, P2, or none.");
  }

  return {
    baseUrl: normalizeBaseUrl(readFlag("base-url") || process.env.TOPINFO_QA_BASE_URL || "http://localhost:3000"),
    routes: selectRoutes(routeList),
    viewports: selectViewports(viewportList),
    outputDirectory: resolve(readFlag("output") || process.env.TOPINFO_QA_OUTPUT || DEFAULT_OUTPUT),
    screenshots: readBoolean(readFlag("screenshots") || process.env.TOPINFO_QA_SCREENSHOTS, true),
    failOn,
    timeoutMs: Number.parseInt(process.env.TOPINFO_QA_TIMEOUT_MS || `${DEFAULT_TIMEOUT_MS}`, 10),
  };
}

function makeFinding(severity, code, message, selector = "document", details = {}) {
  return { severity, code, message, selector, details };
}

function dedupeFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = `${finding.severity}|${finding.code}|${finding.selector}|${JSON.stringify(finding.details || {})}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectRuntimeSignals(page) {
  const state = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    httpFailures: [],
  };

  page.on("console", (message) => {
    if (message.type() === "error") state.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => state.pageErrors.push(error.message || String(error)));
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (/^(data|blob):/i.test(url)) return;
    state.requestFailures.push({
      method: request.method(),
      resourceType: request.resourceType(),
      url,
      errorText: request.failure()?.errorText || "unknown request failure",
    });
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    const request = response.request();
    state.httpFailures.push({
      status: response.status(),
      resourceType: request.resourceType(),
      url: response.url(),
    });
  });

  return state;
}

function runtimeFindings(state) {
  const findings = [];
  for (const message of state.pageErrors) {
    findings.push(makeFinding("P1", "PAGE_ERROR", "An uncaught browser error occurred.", "window", { message }));
  }
  for (const message of state.consoleErrors) {
    findings.push(makeFinding("P2", "CONSOLE_ERROR", "The page logged a console error.", "console", { message }));
  }
  for (const failure of state.requestFailures) {
    if (failure.errorText === "net::ERR_ABORTED" && /firestore\.googleapis\.com\/google\.firestore\.v1\.Firestore\/Listen\/channel/i.test(failure.url)) {
      continue;
    }
    const severity = ["document", "script", "stylesheet", "image", "font"].includes(failure.resourceType) ? "P1" : "P2";
    findings.push(makeFinding(severity, "REQUEST_FAILED", "A browser request failed.", failure.url, failure));
  }
  for (const failure of state.httpFailures) {
    const severity = ["document", "script", "stylesheet", "image", "font"].includes(failure.resourceType) ? "P1" : "P2";
    findings.push(makeFinding(severity, "HTTP_RESOURCE_FAILURE", "A browser resource returned an HTTP error.", failure.url, failure));
  }
  return findings;
}

async function settleLazyMedia(page, viewport) {
  await page.evaluate(async ({ viewportHeight }) => {
    const delay = (milliseconds) => new Promise((resolveDelay) => window.setTimeout(resolveDelay, milliseconds));
    const step = Math.max(360, Math.floor(viewportHeight * 0.82));
    const maximum = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
    for (let y = 0; y <= maximum; y += step) {
      window.scrollTo(0, Math.min(y, maximum));
      await delay(45);
    }
    window.scrollTo(0, maximum);
    await delay(80);
    window.scrollTo(0, 0);
  }, { viewportHeight: viewport.height });

  await page.evaluate(async () => {
    const pending = [...document.images].filter((image) => !image.complete);
    if (pending.length > 0) {
      await Promise.race([
        Promise.all(pending.map((image) => new Promise((resolveImage) => {
          if (image.complete) {
            resolveImage();
            return;
          }
          const done = () => resolveImage();
          image.addEventListener("load", done, { once: true });
          image.addEventListener("error", done, { once: true });
        }))),
        new Promise((resolveTimeout) => window.setTimeout(resolveTimeout, 4_000)),
      ]);
    }
    if (document.fonts?.ready) await document.fonts.ready;
  });
  await page.waitForTimeout(80);
}

async function settleFunctionalRoute(page, route) {
  if (!["resources", "suggestions"].includes(route.name)) return;
  await page.waitForFunction(() => {
    const board = document.querySelector(".public-board");
    if (!board) return false;
    return !board.textContent?.includes("불러오는 중입니다.");
  }, undefined, { timeout: 10_000 });
}

async function filterBaselineFindings(page, findings) {
  const filtered = [];
  for (const finding of findings) {
    if (finding.code === "ARIA_DISCLOSURE_STATE") {
      try {
        const element = page.locator(finding.selector).first();
        if (await element.count() > 0 && await element.evaluate((node) => node.matches("details > summary"))) continue;
      } catch {
        // Keep the finding when the selector cannot be inspected reliably.
      }
    }

    if (finding.code === "TOUCH_TARGET_SIZE" && finding.selector.includes("input")) {
      try {
        const element = page.locator(finding.selector).first();
        const coveredByLargeLabel = await element.count() > 0 && await element.evaluate((node) => {
          if (!(node instanceof HTMLInputElement) || !["checkbox", "radio"].includes(node.type)) return false;
          const label = node.closest("label");
          if (!label) return false;
          const rect = label.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44;
        });
        if (coveredByLargeLabel) continue;
      } catch {
        // Keep the finding when the selector cannot be inspected reliably.
      }
    }

    filtered.push(finding);
  }
  return filtered;
}

async function auditExtendedDom(page, viewport) {
  return page.evaluate(({ rootSelector, viewportWidth }) => {
    const root = document.querySelector(rootSelector);
    if (!root) {
      return [{ severity: "P1", code: "ROOT_MISSING", message: "Public site root was not rendered.", selector: rootSelector, details: {} }];
    }

    const findings = [];
    const tolerance = 2;
    const koreanPattern = /[가-힣]/;
    const add = (severity, code, message, element, details = {}) => findings.push({
      severity,
      code,
      message,
      selector: selectorFor(element),
      details,
    });
    const selectorFor = (element) => {
      if (!(element instanceof Element)) return "document";
      if (element.id) return `#${CSS.escape(element.id)}`;
      const parts = [];
      let current = element;
      while (current && current !== document.documentElement && parts.length < 4) {
        let part = current.tagName.toLowerCase();
        const classes = [...current.classList].filter(Boolean).slice(0, 2);
        if (classes.length) part += `.${classes.map((name) => CSS.escape(name)).join(".")}`;
        const parent = current.parentElement;
        if (parent) {
          const siblings = [...parent.children].filter((sibling) => sibling.tagName === current.tagName);
          if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
        parts.unshift(part);
        current = parent;
      }
      return parts.join(" > ");
    };
    const isVisible = (element) => {
      if (!(element instanceof Element)) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number.parseFloat(style.opacity || "1") > 0.01
        && rect.width > 0.5
        && rect.height > 0.5
        && !element.closest("[hidden], [aria-hidden='true']");
    };
    const accessibleName = (element) => {
      const labelledBy = element.getAttribute("aria-labelledby");
      const referenced = labelledBy
        ? labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" ")
        : "";
      return [
        element.getAttribute("aria-label"),
        referenced,
        element.textContent,
        element.getAttribute("title"),
        element.querySelector("img[alt]")?.getAttribute("alt"),
      ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    };
    const intersects = (left, right) => (
      Math.min(left.right, right.right) - Math.max(left.left, right.left) > 2
      && Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 2
    );

    const ids = new Map();
    for (const element of root.querySelectorAll("[id]")) {
      const id = element.id;
      if (!id) continue;
      if (ids.has(id)) add("P1", "DUPLICATE_ID", `Duplicate id '${id}' breaks ARIA references.`, element);
      else ids.set(id, element);
    }

    const mains = [...root.querySelectorAll("main")].filter(isVisible);
    if (mains.length !== 1) add("P1", "MAIN_LANDMARK_COUNT", "A public route must expose exactly one visible main landmark.", root, { count: mains.length });
    const h1s = [...root.querySelectorAll("h1")].filter(isVisible);
    if (h1s.length !== 1) add("P2", "H1_COUNT", "A public route should expose exactly one visible h1.", root, { count: h1s.length });

    for (const element of root.querySelectorAll("a[href], button:not([disabled]), [role='button'], [role='tab']")) {
      if (!isVisible(element)) continue;
      if (!accessibleName(element)) add("P1", "INTERACTIVE_NAME_MISSING", "A visible interactive control has no accessible name.", element);
    }

    for (const anchor of root.querySelectorAll("a[href]")) {
      if (!isVisible(anchor)) continue;
      const href = anchor.getAttribute("href") || "";
      if (!href.trim() || /^javascript:/i.test(href)) add("P1", "INVALID_LINK_TARGET", "A visible link has an invalid destination.", anchor, { href });
    }

    const controlledElements = [...root.querySelectorAll("[aria-controls]")];
    for (const control of controlledElements) {
      const controlledId = control.getAttribute("aria-controls");
      if (!controlledId || !document.getElementById(controlledId)) {
        add("P1", "ARIA_CONTROLS_TARGET_MISSING", "aria-controls points to an element that is not present in the DOM.", control, { controlledId });
      }
    }

    for (const dialog of root.querySelectorAll("[role='dialog']")) {
      if (!isVisible(dialog)) continue;
      if (!dialog.getAttribute("aria-label") && !dialog.getAttribute("aria-labelledby")) {
        add("P1", "DIALOG_NAME_MISSING", "A visible dialog has no accessible name.", dialog);
      }
    }

    for (const hiddenContainer of root.querySelectorAll("[aria-hidden='true']")) {
      const focusable = [...hiddenContainer.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]")]
        .find((element) => element.getAttribute("tabindex") !== "-1" && isVisible(element));
      if (focusable) add("P1", "ARIA_HIDDEN_FOCUSABLE", "aria-hidden content contains a visible focusable control.", focusable);
    }

    for (const tablist of root.querySelectorAll("[role='tablist']")) {
      if (!isVisible(tablist)) continue;
      const tabs = [...tablist.querySelectorAll("[role='tab']")].filter(isVisible);
      const selected = tabs.filter((tab) => tab.getAttribute("aria-selected") === "true");
      if (selected.length !== 1) add("P1", "TAB_SELECTED_COUNT", "A single-select tablist must have exactly one selected tab.", tablist, { selected: selected.length, tabs: tabs.length });
      for (const tab of tabs) {
        const panelId = tab.getAttribute("aria-controls");
        if (!tab.id || !panelId) {
          add("P1", "TAB_RELATION_MISSING", "Each tab needs an id and aria-controls relationship to its panel.", tab, { id: tab.id, panelId });
          continue;
        }
        const panel = document.getElementById(panelId);
        if (!panel || panel.getAttribute("role") !== "tabpanel" || panel.getAttribute("aria-labelledby") !== tab.id) {
          add("P1", "TAB_PANEL_RELATION_INVALID", "The tab and tabpanel ARIA relationship is incomplete.", tab, { panelId });
        }
      }
    }

    for (const form of root.querySelectorAll("form")) {
      if (!isVisible(form)) continue;
      const fields = [...form.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']), select, textarea")].filter(isVisible);
      for (const field of fields) {
        const label = field.closest("label") || (field.id ? root.querySelector(`label[for='${CSS.escape(field.id)}']`) : null);
        const named = label || field.getAttribute("aria-label") || field.getAttribute("aria-labelledby");
        if (!named) add("P1", "FORM_LABEL_MISSING", "A visible form control is not programmatically labelled.", field);
        if (label && /\*/.test(label.textContent || "") && !field.required && field.getAttribute("aria-required") !== "true") {
          add("P1", "FORM_REQUIRED_STATE_MISSING", "A visually required field does not expose required or aria-required.", field);
        }
      }
      const submit = [...form.querySelectorAll("button[type='submit'], input[type='submit']")].find(isVisible);
      if (!submit) add("P1", "FORM_SUBMIT_MISSING", "A visible form has no visible submit control.", form);
    }

    const images = [...root.querySelectorAll("img")].filter(isVisible);
    for (const image of images) {
      const rect = image.getBoundingClientRect();
      const src = image.currentSrc || image.src || "";
      const style = getComputedStyle(image);
      if (!image.complete || image.naturalWidth === 0 || image.naturalHeight === 0) {
        add("P1", "IMAGE_LOAD_FAILURE", "A visible image did not load with valid intrinsic dimensions.", image, {
          src,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
        });
        continue;
      }
      if (!image.hasAttribute("width") || !image.hasAttribute("height")) {
        add("P2", "IMAGE_INTRINSIC_ATTRIBUTES_MISSING", "A visible image lacks explicit width and height attributes.", image, {
          src,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
        });
      }
      const naturalRatio = image.naturalWidth / image.naturalHeight;
      const renderedRatio = rect.width / rect.height;
      if ((style.objectFit === "fill" || style.objectFit === "") && Math.abs((renderedRatio / naturalRatio) - 1) > 0.06) {
        add("P1", "IMAGE_ASPECT_DISTORTION", "A visible image is rendered at a distorted aspect ratio.", image, {
          src,
          naturalRatio: Number(naturalRatio.toFixed(3)),
          renderedRatio: Number(renderedRatio.toFixed(3)),
          objectFit: style.objectFit,
        });
      }
      if (rect.width > image.naturalWidth * 1.35 || rect.height > image.naturalHeight * 1.35) {
        add("P2", "IMAGE_UPSCALED", "A visible image is enlarged substantially beyond its intrinsic pixel dimensions.", image, {
          src,
          natural: `${image.naturalWidth}x${image.naturalHeight}`,
          rendered: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
        });
      }
      const isProductEvidence = /\/assets\/(product|uplus)\//i.test(src)
        || /(POSBANK|APEXA|Toss Front|토스프론트|IP-520GA|전화기|CCTV|프린터|단말기)/i.test(image.alt || "");
      if (isProductEvidence && style.objectFit === "cover" && Math.abs((renderedRatio / naturalRatio) - 1) > 0.08) {
        add("P1", "PRODUCT_IMAGE_CROP", "Exact product evidence uses object-fit: cover and loses part of the source silhouette.", image, {
          src,
          naturalRatio: Number(naturalRatio.toFixed(3)),
          renderedRatio: Number(renderedRatio.toFixed(3)),
        });
      }
      const container = image.parentElement?.closest("figure, picture, [class*='media'], [class*='image'], [class*='visual']") || image.parentElement;
      if (container && container !== image && isVisible(container)) {
        const containerRect = container.getBoundingClientRect();
        if (rect.left < containerRect.left - tolerance || rect.right > containerRect.right + tolerance) {
          const overflow = getComputedStyle(container).overflowX;
          add(overflow === "hidden" || overflow === "clip" ? "P2" : "P1", "IMAGE_CONTAINER_OVERFLOW", "A visible image extends beyond its intended visual container.", image, {
            src,
            container: selectorFor(container),
            overflow,
            imageBounds: [Math.round(rect.left), Math.round(rect.right)],
            containerBounds: [Math.round(containerRect.left), Math.round(containerRect.right)],
          });
        }
      }
      if (rect.left < -tolerance || rect.right > document.documentElement.clientWidth + tolerance) {
        add("P1", "IMAGE_VIEWPORT_OVERFLOW", "A visible image extends outside the viewport.", image, { src, left: rect.left, right: rect.right });
      }
      if (!image.hasAttribute("alt")) add("P1", "IMAGE_ALT_MISSING", "A visible image has no alt attribute.", image, { src });
    }

    for (const video of root.querySelectorAll("video")) {
      if (!isVisible(video)) continue;
      if (video.error || (!video.currentSrc && !video.querySelector("source[src]"))) {
        add("P1", "VIDEO_LOAD_FAILURE", "A visible video has no playable source or reports an error.", video, {
          currentSrc: video.currentSrc,
          error: video.error?.message || null,
        });
      }
    }

    const koreanCandidates = [...root.querySelectorAll("h1, h2, h3, h4, p, li, label, button, a, summary")].filter((element) => (
      isVisible(element) && koreanPattern.test(element.textContent || "") && (element.textContent || "").trim().length >= 4
    ));
    for (const element of koreanCandidates) {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const fontSize = Number.parseFloat(style.fontSize);
      const text = (element.textContent || "").replace(/\s+/g, "").trim();
      if (text.length >= 4 && rect.width < fontSize * 1.8 && rect.height > fontSize * 2.6) {
        add("P1", "KOREAN_ONE_CHARACTER_WRAP", "Korean text is constrained to roughly one character per line.", element, {
          text: text.slice(0, 40),
          width: Number(rect.width.toFixed(1)),
          fontSize,
        });
      }
    }

    if (viewportWidth <= 768) {
      const fixedOverlays = [...root.querySelectorAll("*")].filter((element) => {
        if (!isVisible(element)) return false;
        const style = getComputedStyle(element);
        return style.position === "fixed" && element.querySelector("a, button, input, select, textarea");
      });
      const header = root.querySelector(".public-header");
      for (const overlay of fixedOverlays) {
        if (header && (header === overlay || header.contains(overlay))) continue;
        const overlayRect = overlay.getBoundingClientRect();
        const collisions = [...root.querySelectorAll("main a, main button, main input, main select, main textarea, main h1, main h2, main h3, main p")]
          .filter((element) => isVisible(element) && !overlay.contains(element) && intersects(overlayRect, element.getBoundingClientRect()))
          .slice(0, 6)
          .map(selectorFor);
        if (collisions.length) add("P1", "FIXED_CONTROL_OVERLAP", "A fixed mobile control overlaps visible content.", overlay, { collisions });
      }
    }

    return findings;
  }, { rootSelector: ROOT_SELECTOR, viewportWidth: viewport.width });
}

async function auditMenuInteraction(page, viewport, captureState) {
  const findings = [];
  const add = (code, message, selector, details = {}) => findings.push(makeFinding("P1", code, message, selector, details));
  const mobile = viewport.width <= 1180;
  const selector = mobile
    ? ".public-header__menu-button[aria-controls='public-mobile-menu']"
    : ".public-header__nav-item > button[aria-expanded][aria-controls]";
  const trigger = page.locator(selector).first();
  if (await trigger.count() === 0 || !(await trigger.isVisible())) {
    add("MENU_TRIGGER_MISSING", `The ${mobile ? "mobile" : "desktop"} menu trigger is not visible.`, selector);
    return findings;
  }

  if (await trigger.getAttribute("aria-expanded") !== "false") {
    add("MENU_INITIAL_STATE", "The menu trigger must start with aria-expanded=false.", selector);
  }
  await trigger.click();
  await page.waitForTimeout(80);
  const controlledId = await trigger.getAttribute("aria-controls");
  const panel = controlledId ? page.locator(`#${controlledId}`) : null;
  const panelVisible = panel && await panel.count() > 0 && await panel.isVisible();
  if (await trigger.getAttribute("aria-expanded") !== "true" || !panelVisible) {
    add("MENU_OPEN_STATE", "Opening the menu did not expose its controlled region.", selector, { controlledId });
  } else {
    const focusInside = await panel.evaluate((element) => element.contains(document.activeElement));
    if (mobile && !focusInside) add("MOBILE_MENU_FOCUS", "Opening the mobile menu did not move focus inside the dialog.", `#${controlledId}`);
    await captureState("menu-open");
  }

  await page.keyboard.press("Escape");
  await page.waitForFunction(
    (triggerSelector) => {
      const element = document.querySelector(triggerSelector);
      return element?.getAttribute("aria-expanded") === "false" && document.activeElement === element;
    },
    selector,
    { timeout: 800 },
  ).catch(() => {});
  const focusState = await trigger.evaluate((element) => ({
    focused: document.activeElement === element,
    activeElement: document.activeElement instanceof HTMLElement
      ? {
          tag: document.activeElement.tagName.toLowerCase(),
          id: document.activeElement.id,
          className: document.activeElement.className,
        }
      : null,
  }));
  if (await trigger.getAttribute("aria-expanded") !== "false" || !focusState.focused) {
    add("MENU_ESCAPE_STATE", "Escape did not close the menu and return focus to its trigger.", selector, focusState);
  }
  return findings;
}

async function auditTabInteraction(page, captureState) {
  const findings = [];
  const tablists = page.locator("[role='tablist']");
  for (let index = 0; index < await tablists.count(); index += 1) {
    const tablist = tablists.nth(index);
    if (!(await tablist.isVisible())) continue;
    // Keep the locator stable when a horizontally scrollable mobile tablist
    // shifts the active item into view after keyboard navigation.
    const tabs = tablist.locator(":scope > [role='tab']");
    if (await tabs.count() < 2) continue;
    const first = tabs.nth(0);
    const second = tabs.nth(1);
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(50);
    const keyboardMoved = await second.evaluate((element) => document.activeElement === element);
    if (!keyboardMoved) {
      findings.push(makeFinding("P1", "TAB_KEYBOARD_NAVIGATION", "ArrowRight did not move focus to the next tab.", `[role='tablist']:nth-of-type(${index + 1})`));
    }
    await second.click();
    await page.waitForTimeout(80);
    if (await second.getAttribute("aria-selected") !== "true") {
      findings.push(makeFinding("P1", "TAB_CLICK_SELECTION", "Clicking a tab did not update aria-selected.", `[role='tablist']:nth-of-type(${index + 1})`));
    } else {
      await captureState(`tab-${index + 2}`);
    }
  }
  return findings;
}

async function auditPublicFormValidation(page, captureState, routeName) {
  const findings = [];
  const form = page.locator("form.public-form").first();
  if (await form.count() === 0 || !(await form.isVisible())) {
    return [makeFinding("P1", "PUBLIC_FORM_MISSING", `The ${routeName} route has no visible public form.`, "form.public-form")];
  }

  const submit = form.locator("button[type='submit']").first();
  if (await submit.count() === 0 || !(await submit.isVisible())) {
    return [makeFinding("P1", "PUBLIC_FORM_SUBMIT_MISSING", `The ${routeName} form has no visible submit button.`, "form.public-form")];
  }

  await submit.click();
  await page.waitForTimeout(80);
  const alert = form.locator("[role='alert']").first();
  if (await alert.count() === 0 || !(await alert.isVisible()) || !(await alert.textContent())?.trim()) {
    findings.push(makeFinding("P1", "FORM_VALIDATION_ALERT_MISSING", "Submitting an empty form did not expose a visible validation alert.", "form.public-form"));
  } else {
    await captureState("validation-error");
  }
  const success = page.locator(".public-form__success");
  if (await success.count() > 0 && await success.isVisible()) {
    findings.push(makeFinding("P0", "FALSE_FORM_SUCCESS", "The empty consultation form displayed a success state without a real write.", ".public-form__success"));
  }
  const focusIsUseful = await form.evaluate((element) => {
    const active = document.activeElement;
    return Boolean(active && element.contains(active) && (active.matches("input, select, textarea, [role='alert']") || active.getAttribute("aria-invalid") === "true"));
  });
  if (!focusIsUseful) {
    findings.push(makeFinding("P1", "FORM_ERROR_FOCUS", "Validation did not move focus to an invalid control or the error alert.", "form.public-form"));
  }
  return findings;
}

async function captureScreenshot(page, directory, route, viewport, state, enabled) {
  if (!enabled) return null;
  const fileName = `${route.name}-${viewport.name}-${state}.png`;
  const path = resolve(directory, "screenshots", fileName);
  await mkdir(resolve(directory, "screenshots"), { recursive: true });
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  return path;
}

function shouldFail(findings, failOn) {
  if (failOn === "NONE") return false;
  const threshold = SEVERITY_ORDER[failOn];
  return findings.some((finding) => (SEVERITY_ORDER[finding.severity] ?? 99) <= threshold);
}

function printResult(result) {
  const counts = result.findings.reduce((total, finding) => {
    total[finding.severity] = (total[finding.severity] || 0) + 1;
    return total;
  }, {});
  const status = result.findings.length ? "FINDINGS" : "PASS";
  console.log(`${status.padEnd(8)} ${result.route.padEnd(17)} ${result.viewport.padEnd(10)} P0:${counts.P0 || 0} P1:${counts.P1 || 0} P2:${counts.P2 || 0}`);
}

async function main() {
  const config = resolveConfig();
  await mkdir(config.outputDirectory, { recursive: true });
  await ensureServerAvailable(config.baseUrl);
  const playwrightInfo = await loadPlaywright();
  const browser = await launchAuditBrowser(playwrightInfo);
  const startedAt = new Date().toISOString();
  const results = [];

  console.log(`TOPINFO QA: ${config.baseUrl}`);
  console.log(`Playwright: ${playwrightInfo.version} (${playwrightInfo.source})`);
  console.log(`Routes: ${config.routes.map((route) => route.name).join(", ")}`);
  console.log(`Viewports: ${config.viewports.map((viewport) => viewport.name).join(", ")}`);

  try {
    for (const viewport of config.viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: "reduce",
        locale: "ko-KR",
        colorScheme: "light",
        deviceScaleFactor: 1,
      });

      try {
        for (const route of config.routes) {
          const page = await context.newPage();
          const runtime = collectRuntimeSignals(page);
          const screenshots = [];
          const started = Date.now();
          let findings = [];
          let navigationError = null;

          const captureState = async (state) => {
            try {
              const screenshot = await captureScreenshot(page, config.outputDirectory, route, viewport, state, config.screenshots);
              if (screenshot) screenshots.push(screenshot);
            } catch (error) {
              findings.push(makeFinding("P1", "SCREENSHOT_FAILURE", "A required QA screenshot could not be captured.", "page", {
                state,
                error: error.message || String(error),
              }));
            }
          };

          try {
            const url = new URL(route.path, config.baseUrl).href;
            await preparePublicPage(page, url, config.timeoutMs);
            await settleLazyMedia(page, viewport);
            await settleFunctionalRoute(page, route);
            await captureState("default");
            findings.push(...await filterBaselineFindings(page, await auditRenderedPage(page, viewport)));
            findings.push(...await auditExtendedDom(page, viewport));
            findings.push(...await auditFixedCtaOverlap(page, viewport));

            if (route.name === "home") findings.push(...await auditMenuInteraction(page, viewport, captureState));
            if (route.name === "products") findings.push(...await auditTabInteraction(page, captureState));
            if (route.name === "consultation" || route.name === "paper-request") {
              findings.push(...await auditPublicFormValidation(page, captureState, route.name));
            }
          } catch (error) {
            navigationError = error.message || String(error);
            findings.push(makeFinding("P1", "ROUTE_AUDIT_FAILURE", "The route could not be fully audited.", route.path, { error: navigationError }));
          }

          findings.push(...runtimeFindings(runtime));
          findings = dedupeFindings(findings).sort((left, right) => (
            (SEVERITY_ORDER[left.severity] ?? 99) - (SEVERITY_ORDER[right.severity] ?? 99)
            || left.code.localeCompare(right.code)
          ));

          const result = {
            route: route.name,
            path: route.path,
            viewport: viewport.name,
            durationMs: Date.now() - started,
            navigationError,
            screenshots,
            findings,
          };
          results.push(result);
          printResult(result);
          await page.close();
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const allFindings = results.flatMap((result) => result.findings.map((finding) => ({
    route: result.route,
    viewport: result.viewport,
    ...finding,
  })));
  const summary = allFindings.reduce((total, finding) => {
    total[finding.severity] = (total[finding.severity] || 0) + 1;
    return total;
  }, { P0: 0, P1: 0, P2: 0, INFO: 0 });
  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    baseUrl: config.baseUrl,
    playwright: {
      version: playwrightInfo.version,
      source: playwrightInfo.source,
      executablePath: playwrightInfo.executablePath || null,
    },
    config: {
      routes: config.routes,
      viewports: config.viewports,
      screenshots: config.screenshots,
      failOn: config.failOn,
    },
    summary: {
      pages: results.length,
      pagesWithFindings: results.filter((result) => result.findings.length > 0).length,
      ...summary,
    },
    results,
  };
  const reportPath = resolve(config.outputDirectory, "public-browser-qa-report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`\nReport: ${reportPath}`);
  console.log(`Summary: ${results.length} route/viewport cases, P0:${summary.P0} P1:${summary.P1} P2:${summary.P2}`);
  if (shouldFail(allFindings, config.failOn)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`TOPINFO public browser QA could not run:\n${error.stack || error.message || error}`);
  process.exitCode = 1;
});
