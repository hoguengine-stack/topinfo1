import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const REQUIRED_VIEWPORTS = [
  { name: "320x800", width: 320, height: 800 },
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "2560x1440", width: 2560, height: 1440 },
];

export const PUBLIC_ROUTES = [
  { name: "home", path: "/" },
  { name: "toss-pos", path: "/toss-pos/" },
  { name: "uplus-ai-phone", path: "/uplus-ai-phone/" },
  { name: "products", path: "/products/" },
  { name: "resources", path: "/support/resources/" },
  { name: "suggestions", path: "/support/suggestions/" },
  { name: "consultation", path: "/contact/" },
  { name: "paper-request", path: "/support/paper/" },
];

const INSTALL_COMMAND = "npx --yes playwright install chromium";
const RUN_COMMAND = "node --test tests/public-layout-browser.test.mjs";

const normalizeBaseUrl = (value) => `${value.replace(/\/+$/, "")}/`;

const parseList = (value) => value
  ?.split(",")
  .map((item) => item.trim())
  .filter(Boolean);

export function resolveAuditConfig(env = process.env) {
  const requestedRoutes = parseList(env.TOPINFO_AUDIT_ROUTES);
  const requestedWidths = new Set(
    (parseList(env.TOPINFO_AUDIT_VIEWPORTS) || []).map((value) => Number.parseInt(value, 10)),
  );

  const routes = requestedRoutes?.length
    ? requestedRoutes.map((requested) => {
        const known = PUBLIC_ROUTES.find((route) => route.name === requested || route.path === requested);
        if (known) return known;
        if (requested.startsWith("/") || requested.startsWith("?")) {
          return {
            name: requested.replace(/[^a-zA-Z0-9가-힣]+/g, "-").replace(/^-|-$/g, "") || "custom",
            path: requested.startsWith("?") ? `/${requested}` : requested,
          };
        }
        throw new Error(
          `Unknown TOPINFO_AUDIT_ROUTES entry: ${requested}. `
          + `Use one of ${PUBLIC_ROUTES.map((route) => route.name).join(", ")} or a path beginning with /.`,
        );
      })
    : PUBLIC_ROUTES;

  const viewports = requestedWidths.size
    ? REQUIRED_VIEWPORTS.filter((viewport) => requestedWidths.has(viewport.width))
    : REQUIRED_VIEWPORTS;

  if (viewports.length === 0) {
    throw new Error(
      `TOPINFO_AUDIT_VIEWPORTS did not match a required width. `
      + `Use one or more of ${REQUIRED_VIEWPORTS.map((viewport) => viewport.width).join(", ")}.`,
    );
  }

  return {
    baseUrl: normalizeBaseUrl(env.TOPINFO_BASE_URL || "http://localhost:3000"),
    routes,
    viewports,
    navigationTimeoutMs: Number.parseInt(env.TOPINFO_AUDIT_TIMEOUT_MS || "20000", 10),
    maxFindingsPerPage: Number.parseInt(env.TOPINFO_AUDIT_MAX_FINDINGS || "60", 10),
  };
}

export async function ensureServerAvailable(baseUrl, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(baseUrl, {
      signal: controller.signal,
      headers: { accept: "text/html" },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      throw new Error(`expected text/html but received ${contentType || "an unknown content type"}`);
    }
    return { status: response.status, contentType };
  } catch (error) {
    const reason = error?.name === "AbortError" ? `${timeoutMs}ms timeout` : error?.message || String(error);
    throw new Error(
      `TOPINFO local server is unavailable at ${baseUrl} (${reason}).\n`
      + `Start it from the real repository path with: npm run dev\n`
      + `Then run: ${RUN_COMMAND}`,
      { cause: error },
    );
  } finally {
    clearTimeout(timer);
  }
}

const parseVersion = (version) => version
  .split(".")
  .map((part) => Number.parseInt(part, 10) || 0);

const compareVersionsDescending = (left, right) => {
  const a = parseVersion(left.version);
  const b = parseVersion(right.version);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (b[index] || 0) - (a[index] || 0);
  }
  return 0;
};

const readPackageVersion = (packageDirectory) => {
  try {
    return JSON.parse(readFileSync(join(packageDirectory, "package.json"), "utf8")).version || "0.0.0";
  } catch {
    return "0.0.0";
  }
};

const npmCacheDirectories = () => {
  const directories = new Set();
  if (process.env.npm_config_cache) directories.add(process.env.npm_config_cache);
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    directories.add(join(process.env.LOCALAPPDATA, "npm-cache"));
  } else {
    directories.add(join(homedir(), ".npm"));
  }

  try {
    const configured = process.platform === "win32"
      ? execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm config get cache"], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }).trim()
      : execFileSync("npm", ["config", "get", "cache"], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        }).trim();
    if (configured) directories.add(configured);
  } catch {
    // Default cache paths above remain available when npm config cannot be queried.
  }

  return [...directories];
};

const playwrightCandidates = () => {
  const candidates = [];
  const explicitPath = process.env.TOPINFO_PLAYWRIGHT_PATH;
  if (explicitPath) {
    const explicitDirectory = explicitPath.endsWith("package.json") || explicitPath.endsWith("index.mjs")
      ? dirname(explicitPath)
      : explicitPath;
    candidates.push({ directory: resolve(explicitDirectory), source: "TOPINFO_PLAYWRIGHT_PATH" });
  }

  candidates.push({ directory: resolve("node_modules", "playwright"), source: "local node_modules" });

  for (const cacheDirectory of npmCacheDirectories()) {
    const npxDirectory = join(cacheDirectory, "_npx");
    if (!existsSync(npxDirectory)) continue;
    for (const entry of readdirSync(npxDirectory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      candidates.push({
        directory: join(npxDirectory, entry.name, "node_modules", "playwright"),
        source: "npx cache",
      });
    }
  }

  return candidates
    .filter((candidate, index, all) => (
      existsSync(join(candidate.directory, "index.mjs"))
      && all.findIndex((item) => item.directory === candidate.directory) === index
    ))
    .map((candidate) => ({ ...candidate, version: readPackageVersion(candidate.directory) }))
    .filter((candidate) => !candidate.version.includes("-"))
    .sort(compareVersionsDescending);
};

export async function loadPlaywright() {
  const importErrors = [];

  try {
    const direct = await import("playwright");
    return { playwright: direct, source: "local dependency", version: "local" };
  } catch (error) {
    importErrors.push(`local dependency: ${error?.code || error?.message || error}`);
  }

  const loaded = [];
  for (const candidate of playwrightCandidates()) {
    try {
      const module = await import(pathToFileURL(join(candidate.directory, "index.mjs")).href);
      const executablePath = module.chromium?.executablePath?.();
      loaded.push({ ...candidate, module, executablePath, browserExists: Boolean(executablePath && existsSync(executablePath)) });
    } catch (error) {
      importErrors.push(`${candidate.directory}: ${error?.message || error}`);
    }
  }

  const selected = loaded.find((candidate) => candidate.browserExists) || loaded[0];
  if (selected) {
    return {
      playwright: selected.module,
      source: `${selected.source}: ${selected.directory}`,
      version: selected.version,
      browserExists: selected.browserExists,
      executablePath: selected.executablePath,
    };
  }

  throw new Error(
    `Playwright could not be loaded without changing package.json.\n`
    + `Prepare the reusable npx cache and Chromium with: ${INSTALL_COMMAND}\n`
    + `Then run: ${RUN_COMMAND}\n`
    + `Optional override: set TOPINFO_PLAYWRIGHT_PATH to a Playwright package directory.\n`
    + `Import attempts: ${importErrors.join(" | ")}`,
  );
}

export async function launchAuditBrowser(playwrightInfo) {
  let bundledBrowserError;
  try {
    return await playwrightInfo.playwright.chromium.launch({ headless: true });
  } catch (error) {
    bundledBrowserError = error;
  }

  const systemCandidates = process.platform === "win32"
    ? [
        process.env.TOPINFO_CHROMIUM_EXECUTABLE,
        process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
        process.env.PROGRAMFILES && join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe"),
        process.env["PROGRAMFILES(X86)"] && join(process.env["PROGRAMFILES(X86)"], "Google", "Chrome", "Application", "chrome.exe"),
        process.env.PROGRAMFILES && join(process.env.PROGRAMFILES, "Microsoft", "Edge", "Application", "msedge.exe"),
        process.env["PROGRAMFILES(X86)"] && join(process.env["PROGRAMFILES(X86)"], "Microsoft", "Edge", "Application", "msedge.exe"),
      ]
    : process.platform === "darwin"
      ? [
          process.env.TOPINFO_CHROMIUM_EXECUTABLE,
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
      : [
          process.env.TOPINFO_CHROMIUM_EXECUTABLE,
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "/usr/bin/microsoft-edge",
        ];

  const launchErrors = [];
  for (const executablePath of systemCandidates.filter(Boolean)) {
    if (!existsSync(executablePath)) continue;
    try {
      return await playwrightInfo.playwright.chromium.launch({ headless: true, executablePath });
    } catch (error) {
      launchErrors.push(`${executablePath}: ${error?.message || error}`);
    }
  }

  throw new Error(
    `Chromium could not start for Playwright ${playwrightInfo.version} (${playwrightInfo.source}).\n`
    + `Bundled browser reason: ${bundledBrowserError?.message || bundledBrowserError}\n`
    + (launchErrors.length ? `System browser attempts: ${launchErrors.join(" | ")}\n` : "")
    + `Install the matching isolated browser with: ${INSTALL_COMMAND}\n`
    + `Optional override: set TOPINFO_CHROMIUM_EXECUTABLE to a Chrome/Edge executable path.`,
    { cause: bundledBrowserError },
  );
}

export async function preparePublicPage(page, url, timeoutMs) {
  const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  if (response && response.status() >= 400) {
    throw new Error(`Navigation failed with HTTP ${response.status()} for ${url}`);
  }

  await page.waitForSelector(".public-site.public-v3", { state: "visible", timeout: timeoutMs });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({
    content: `
      html { scroll-behavior: auto !important; }
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0.001s !important;
        transition-delay: 0s !important;
        transition-duration: 0.001s !important;
      }
    `,
  });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    const pendingImages = [...document.images]
      .filter((image) => !image.complete)
      .map((image) => new Promise((resolveImage) => {
        const done = () => resolveImage();
        image.addEventListener("load", done, { once: true });
        image.addEventListener("error", done, { once: true });
        window.setTimeout(done, 2000);
      }));
    await Promise.all(pendingImages);
  });
  await page.waitForTimeout(120);
}

export async function auditRenderedPage(page, viewport) {
  return page.evaluate(({ viewportWidth }) => {
    const root = document.querySelector(".public-site.public-v3");
    const findings = [];
    const tolerance = 2;
    const koreanPattern = /[가-힣]/;
    const metadataPattern = /(^|[-_])(meta|metadata|caption|eyebrow|kicker|overline|index|code|date|time|badge)([-_]|$)/i;

    const add = (code, message, element, details = {}) => {
      findings.push({
        severity: "P1",
        code,
        message,
        selector: element ? selectorFor(element) : "document",
        details,
      });
    };

    const selectorFor = (element) => {
      if (!(element instanceof Element)) return "document";
      if (element.id) return `#${CSS.escape(element.id)}`;
      const parts = [];
      let current = element;
      while (current && current !== document.documentElement && parts.length < 4) {
        let part = current.tagName.toLowerCase();
        const classes = [...current.classList].filter((name) => !name.startsWith("animate-")).slice(0, 2);
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

    const rectOf = (element) => element.getBoundingClientRect();
    const isVisible = (element) => {
      if (!(element instanceof Element)) return false;
      const style = getComputedStyle(element);
      const rect = rectOf(element);
      return style.display !== "none"
        && style.visibility !== "hidden"
        && Number.parseFloat(style.opacity || "1") > 0.01
        && rect.width > 0.5
        && rect.height > 0.5
        && !element.closest('[aria-hidden="true"], [hidden]');
    };

    const directText = (element) => [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    const hasClippingAncestorBeforeRoot = (element) => {
      for (let parent = element.parentElement; parent && parent !== root; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (["auto", "scroll", "hidden", "clip"].includes(style.overflowX)) return true;
      }
      return false;
    };

    if (!root) {
      add("ROOT_MISSING", "Expected .public-site.public-v3 root was not rendered.", null);
      return findings;
    }

    const rootRect = rectOf(root);
    const viewportClientWidth = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > viewportClientWidth + tolerance) {
      add("DOCUMENT_HORIZONTAL_OVERFLOW", "The document scroll width exceeds the viewport.", document.documentElement, {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: viewportClientWidth,
      });
    }
    if (root.scrollWidth > root.clientWidth + tolerance) {
      add("CLIPPED_ROOT_OVERFLOW", "The public root contains horizontal overflow hidden by its own clip/overflow rule.", root, {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
      });
    }

    const expectedFrameWidth = Math.min(viewportClientWidth, 1560);
    if (Math.abs(rootRect.width - expectedFrameWidth) > tolerance) {
      add("FRAME_WIDTH_CONTRACT", "The public frame does not match the min(viewport, 1560px) contract.", root, {
        actual: Number(rootRect.width.toFixed(2)),
        expected: expectedFrameWidth,
      });
    }
    const frameLeftGap = rootRect.left;
    const frameRightGap = viewportClientWidth - rootRect.right;
    if (Math.abs(frameLeftGap - frameRightGap) > tolerance) {
      add("FRAME_CENTERING", "The 1560px public frame is not horizontally centered.", root, {
        leftGap: Number(frameLeftGap.toFixed(2)),
        rightGap: Number(frameRightGap.toFixed(2)),
      });
    }

    const gutter = viewportWidth <= 640 ? 20 : viewportWidth <= 900 ? 28 : 40;
    const expectedContentWidth = Math.min(1320, rootRect.width - (gutter * 2));
    const contentContainers = [...root.querySelectorAll(".public-container, .top-home-container")].filter(isVisible);
    if (contentContainers.length === 0) {
      add("CONTENT_CONTAINER_MISSING", "No visible 1320px content contract container was found.", root);
    }
    for (const container of contentContainers) {
      const rect = rectOf(container);
      if (rect.width > 1320 + tolerance) {
        add("CONTENT_MAX_WIDTH", "A content container exceeds the 1320px maximum.", container, {
          actual: Number(rect.width.toFixed(2)),
        });
      }
      if (Math.abs(rect.width - expectedContentWidth) > 3) {
        add("CONTENT_WIDTH_CONTRACT", "A designated content container does not use the expected responsive contract width.", container, {
          actual: Number(rect.width.toFixed(2)),
          expected: Number(expectedContentWidth.toFixed(2)),
        });
      }
      const expectedLeft = rootRect.left + ((rootRect.width - rect.width) / 2);
      if (Math.abs(rect.left - expectedLeft) > 3) {
        add("CONTENT_CENTERING", "A designated content container is not centered in the public frame.", container, {
          actualLeft: Number(rect.left.toFixed(2)),
          expectedLeft: Number(expectedLeft.toFixed(2)),
        });
      }
    }

    const overflowCandidates = [...root.querySelectorAll("*")].filter((element) => {
      if (!isVisible(element) || getComputedStyle(element).position === "fixed") return false;
      const tag = element.tagName.toLowerCase();
      return ["a", "button", "input", "select", "textarea", "img", "video", "canvas", "svg", "h1", "h2", "h3", "h4", "p", "li"].includes(tag)
        || directText(element).length > 0;
    });
    for (const element of overflowCandidates) {
      const rect = rectOf(element);
      if ((rect.left < rootRect.left - tolerance || rect.right > rootRect.right + tolerance)
        && !hasClippingAncestorBeforeRoot(element)) {
        add("ELEMENT_OUTSIDE_FRAME", "Visible content extends beyond the public frame without a clipping/scroll container.", element, {
          left: Number(rect.left.toFixed(2)),
          right: Number(rect.right.toFixed(2)),
          frameLeft: Number(rootRect.left.toFixed(2)),
          frameRight: Number(rootRect.right.toFixed(2)),
        });
      }
    }

    const koreanElements = new Set();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent || "";
      const parent = walker.currentNode.parentElement;
      if (parent && koreanPattern.test(text) && !parent.closest("script, style, noscript")) koreanElements.add(parent);
    }

    const transformRotatesOrFlips = (transform) => {
      if (!transform || transform === "none") return false;
      try {
        const matrix = new DOMMatrixReadOnly(transform);
        if (matrix.is2D) {
          return Math.abs(matrix.b) > 0.001 || Math.abs(matrix.c) > 0.001 || matrix.a < 0 || matrix.d < 0;
        }
        return Math.abs(matrix.m12) > 0.001
          || Math.abs(matrix.m13) > 0.001
          || Math.abs(matrix.m21) > 0.001
          || Math.abs(matrix.m23) > 0.001
          || Math.abs(matrix.m31) > 0.001
          || Math.abs(matrix.m32) > 0.001
          || matrix.m11 < 0
          || matrix.m22 < 0
          || matrix.m33 < 0;
      } catch {
        return true;
      }
    };

    for (const element of koreanElements) {
      if (!isVisible(element)) continue;
      const style = getComputedStyle(element);
      if (style.writingMode !== "horizontal-tb") {
        add("KOREAN_WRITING_MODE", "Visible Korean text does not use horizontal-tb writing mode.", element, {
          writingMode: style.writingMode,
          text: (element.textContent || "").trim().slice(0, 80),
        });
      }
      for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
        const transform = getComputedStyle(ancestor).transform;
        if (transformRotatesOrFlips(transform)) {
          add("KOREAN_ANCESTOR_ROTATION", "Korean text is rotated, skewed, or flipped by itself or an ancestor.", element, {
            transformedAncestor: selectorFor(ancestor),
            transform,
            text: (element.textContent || "").trim().slice(0, 80),
          });
          break;
        }
        if (ancestor === root) break;
      }
    }

    const bodyCandidates = [...root.querySelectorAll(
      "main p, main li, main dd, main dt, main label, main input, main textarea, main select, main summary, main td, main th, main [data-audit-text='body']",
    )];
    for (const element of bodyCandidates) {
      if (!isVisible(element) || element.closest("small, time, [data-audit-text='metadata']")) continue;
      const classNames = `${element.className || ""}`;
      if (element.getAttribute("data-audit-text") !== "body" && metadataPattern.test(classNames)) continue;
      const tag = element.tagName.toLowerCase();
      const isControl = ["input", "textarea", "select"].includes(tag);
      const content = isControl
        ? element.getAttribute("placeholder") || element.getAttribute("aria-label") || "form control"
        : (element.textContent || "").replace(/\s+/g, " ").trim();
      if (!isControl && content.length < 4) continue;
      const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
      if (fontSize < 14) {
        add("IMPORTANT_TEXT_SIZE", "Important body or form text is smaller than 14px.", element, {
          fontSize,
          text: content.slice(0, 80),
        });
      }
      if (viewportWidth <= 640 && isControl && fontSize < 16) {
        add("MOBILE_FORM_TEXT_SIZE", "A mobile form control uses text smaller than 16px.", element, {
          fontSize,
          text: content.slice(0, 80),
        });
      }
    }

    const mediaElements = [...root.querySelectorAll("img, video, canvas")].filter(isVisible);
    for (const media of mediaElements) {
      if (media instanceof HTMLImageElement && media.complete && media.naturalWidth === 0) {
        add("BROKEN_IMAGE", "A visible image failed to load.", media, { src: media.currentSrc || media.src });
      }
      const container = media.parentElement?.closest(
        "figure, picture, [class*='media'], [class*='image'], [class*='visual']",
      ) || media.parentElement;
      if (!container || container === media || !isVisible(container)) continue;
      const mediaRect = rectOf(media);
      const containerRect = rectOf(container);
      const containerStyle = getComputedStyle(container);
      const allowsVisibleOverflow = !["hidden", "clip", "auto", "scroll"].includes(containerStyle.overflowX);
      if (allowsVisibleOverflow && (
        mediaRect.left < containerRect.left - tolerance
        || mediaRect.right > containerRect.right + tolerance
      )) {
        add("MEDIA_CONTAINER_OVERFLOW", "Media exceeds its visual container horizontally.", media, {
          mediaWidth: Number(mediaRect.width.toFixed(2)),
          containerWidth: Number(containerRect.width.toFixed(2)),
          container: selectorFor(container),
        });
      }
    }

    if (viewportWidth <= 768) {
      const touchTargets = [...root.querySelectorAll(
        "a[href], button:not([disabled]), input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [role='button'], [role='tab']",
      )].filter(isVisible);
      for (const target of touchTargets) {
        const rect = rectOf(target);
        if (rect.width < 44 - tolerance || rect.height < 44 - tolerance) {
          add("TOUCH_TARGET_SIZE", "A mobile/tablet interactive target is smaller than 44x44px.", target, {
            width: Number(rect.width.toFixed(2)),
            height: Number(rect.height.toFixed(2)),
            label: (target.getAttribute("aria-label") || target.textContent || "").trim().slice(0, 60),
          });
        }
      }
    }

    for (const control of root.querySelectorAll("[aria-expanded]")) {
      const expanded = control.getAttribute("aria-expanded");
      if (!["true", "false"].includes(expanded)) {
        add("ARIA_EXPANDED_VALUE", "aria-expanded must be the string true or false.", control, { expanded });
      }
      const controlledId = control.getAttribute("aria-controls");
      if (expanded === "true") {
        const controlled = controlledId ? document.getElementById(controlledId) : null;
        if (!controlledId || !controlled || !isVisible(controlled)) {
          add("ARIA_DISCLOSURE_STATE", "An expanded disclosure does not expose a visible aria-controls target.", control, {
            controlledId,
          });
        }
      }
    }

    for (const tablist of root.querySelectorAll("[role='tablist']")) {
      const tabs = [...tablist.querySelectorAll(":scope [role='tab']")].filter(isVisible);
      const selectedTabs = tabs.filter((tab) => tab.getAttribute("aria-selected") === "true");
      if (tabs.length === 0) add("TABLIST_EMPTY", "A tablist has no visible role=tab controls.", tablist);
      if (selectedTabs.length !== 1 && tablist.getAttribute("aria-multiselectable") !== "true") {
        add("TAB_SELECTION_STATE", "A single-select tablist must expose exactly one aria-selected=true tab.", tablist, {
          tabs: tabs.length,
          selected: selectedTabs.length,
        });
      }
      for (const tab of tabs) {
        if (!["true", "false"].includes(tab.getAttribute("aria-selected"))) {
          add("TAB_ARIA_SELECTED", "Every role=tab requires an explicit aria-selected state.", tab);
        }
      }
    }

    for (const tabsContainer of root.querySelectorAll("[class*='tabs']")) {
      if (!isVisible(tabsContainer) || tabsContainer.getAttribute("role") === "tablist") continue;
      for (const button of tabsContainer.querySelectorAll(":scope > button")) {
        if (!isVisible(button)) continue;
        const hasState = button.hasAttribute("aria-selected")
          || button.hasAttribute("aria-pressed")
          || button.hasAttribute("aria-current");
        if (!hasState) {
          add("TAB_CONTROL_STATE", "A visible tab-like control does not expose aria-selected, aria-pressed, or aria-current.", button);
        }
      }
    }

    return findings;
  }, { viewportWidth: viewport.width });
}

export async function auditDisclosureInteractions(page, viewport) {
  const findings = [];
  const add = (code, message, selector, details = {}) => findings.push({
    severity: "P1", code, message, selector, details,
  });

  const runDisclosure = async (selector, controlledId, name) => {
    const trigger = page.locator(selector).first();
    if (await trigger.count() === 0 || !(await trigger.isVisible())) return;
    const initial = await trigger.getAttribute("aria-expanded");
    if (initial !== "false") {
      add("DISCLOSURE_INITIAL_STATE", `${name} must start with aria-expanded=false.`, selector, { initial });
      return;
    }
    await trigger.click();
    const expanded = await trigger.getAttribute("aria-expanded");
    const controlled = page.locator(`#${controlledId}`);
    if (expanded !== "true" || await controlled.count() === 0 || !(await controlled.isVisible())) {
      add("DISCLOSURE_OPEN_STATE", `${name} did not expose a visible controlled region with aria-expanded=true.`, selector, {
        expanded,
        controlledId,
      });
    }
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      ({ triggerSelector }) => document.querySelector(triggerSelector)?.getAttribute("aria-expanded") === "false",
      { triggerSelector: selector },
      { timeout: 1200 },
    ).catch(() => {});
    await page.waitForTimeout(50);
    const collapsed = await trigger.getAttribute("aria-expanded");
    const focused = await trigger.evaluate((element) => document.activeElement === element);
    if (collapsed !== "false" || !focused) {
      add("DISCLOSURE_ESCAPE_STATE", `${name} did not close on Escape and return focus to its trigger.`, selector, {
        collapsed,
        focused,
      });
    }
  };

  if (viewport.width <= 1180) {
    await runDisclosure(
      ".public-header__menu-button[aria-controls='public-mobile-menu']",
      "public-mobile-menu",
      "mobile navigation",
    );
  } else {
    await runDisclosure(
      ".public-header__support > button[aria-controls='public-support-links']",
      "public-support-links",
      "desktop support menu",
    );
  }

  return findings;
}

export async function auditFixedCtaOverlap(page, viewport) {
  if (viewport.width > 768) return [];

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(80);
  const findings = await page.evaluate(() => {
    const root = document.querySelector(".public-site.public-v3");
    if (!root) return [];
    const viewportHeight = window.innerHeight;
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
    };
    const selectorFor = (element) => {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const classes = [...element.classList].slice(0, 2).map((name) => `.${CSS.escape(name)}`).join("");
      return `${element.tagName.toLowerCase()}${classes}`;
    };
    const intersects = (left, right) => (
      Math.min(left.right, right.right) - Math.max(left.left, right.left) > 4
      && Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 4
    );

    const overlays = [...root.querySelectorAll("*")].filter((element) => {
      if (!isVisible(element)) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.position === "fixed"
        && rect.bottom >= viewportHeight - 48
        && rect.top < viewportHeight
        && element.querySelector("a, button, input, select, textarea");
    });

    const contentCandidates = [...root.querySelectorAll(
      "main h1, main h2, main h3, main h4, main p, main a, main button, main input, main select, main textarea, main img, main video, footer a, footer button, footer p, footer address, footer small",
    )].filter(isVisible);

    const results = [];
    for (const overlay of overlays) {
      const visualChild = [...overlay.children].find((child) => (
        isVisible(child) && getComputedStyle(child).pointerEvents !== "none"
      ));
      const visualRect = (visualChild || overlay).getBoundingClientRect();
      const collisions = contentCandidates
        .filter((candidate) => !overlay.contains(candidate) && intersects(visualRect, candidate.getBoundingClientRect()))
        .slice(0, 8)
        .map(selectorFor);
      if (collisions.length) {
        results.push({
          severity: "P1",
          code: "FIXED_CTA_OVERLAP",
          message: "A mobile fixed CTA overlaps readable or interactive page content at the bottom of the page.",
          selector: selectorFor(overlay),
          details: { collisions },
        });
      }
    }
    return results;
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  return findings;
}

export function formatFindings(findings, context, maxFindings = 60) {
  if (findings.length === 0) return "";
  const shown = findings.slice(0, maxFindings);
  const lines = shown.map((finding, index) => {
    const details = finding.details && Object.keys(finding.details).length
      ? ` ${JSON.stringify(finding.details)}`
      : "";
    return `${index + 1}. [${finding.severity}] ${finding.code} ${finding.selector}: ${finding.message}${details}`;
  });
  if (findings.length > shown.length) {
    lines.push(`... ${findings.length - shown.length} additional findings omitted; set TOPINFO_AUDIT_MAX_FINDINGS to increase the limit.`);
  }
  return `\nTOPINFO browser layout audit failed for ${context} (${findings.length} finding(s)):\n${lines.join("\n")}`;
}
