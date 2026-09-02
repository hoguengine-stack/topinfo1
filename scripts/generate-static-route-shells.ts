import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPublicCanonicalUrl, STANDARD_PUBLIC_ROUTES } from "../src/utils/publicRoutes";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(projectRoot, "dist");
const templatePath = path.join(distRoot, "index.html");

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

function replaceRequired(html: string, label: string, pattern: RegExp, replacement: string): string {
  const matches = html.match(pattern);
  if (!matches || matches.length !== 1) {
    throw new Error(`[static-route-shells] ${label} 태그가 정확히 1개여야 합니다. 발견: ${matches?.length || 0}`);
  }
  return html.replace(pattern, replacement);
}

function renderRouteShell(template: string, route: (typeof STANDARD_PUBLIC_ROUTES)[number]): string {
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const canonicalUrl = escapeHtml(getPublicCanonicalUrl(route.slug));

  let html = template;
  html = replaceRequired(html, "title", /<title>[\s\S]*?<\/title>/g, `<title>${title}</title>`);
  html = replaceRequired(html, "description", /<meta\s+name="description"\s+content="[^"]*"\s*\/>/g, `<meta name="description" content="${description}" />`);
  html = replaceRequired(html, "canonical", /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/g, `<link rel="canonical" href="${canonicalUrl}" />`);
  html = replaceRequired(html, "og:title", /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/g, `<meta property="og:title" content="${title}" />`);
  html = replaceRequired(html, "og:description", /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/g, `<meta property="og:description" content="${description}" />`);
  html = replaceRequired(html, "og:url", /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/g, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = replaceRequired(html, "twitter:title", /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/g, `<meta name="twitter:title" content="${title}" />`);
  html = replaceRequired(html, "twitter:description", /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/g, `<meta name="twitter:description" content="${description}" />`);
  return html;
}

function renderNotFoundShell(template: string): string {
  const title = "페이지를 찾을 수 없습니다 | 탑정보통신";
  const description = "요청한 페이지가 없거나 주소가 변경되었습니다. 탑정보통신 주요 메뉴에서 필요한 정보를 다시 확인해 주세요.";

  let html = template;
  html = replaceRequired(html, "title", /<title>[\s\S]*?<\/title>/g, `<title>${title}</title>`);
  html = replaceRequired(html, "description", /<meta\s+name="description"\s+content="[^"]*"\s*\/>/g, `<meta name="description" content="${description}" />`);
  html = replaceRequired(html, "robots", /<meta\s+name="robots"\s+content="[^"]*"\s*\/>/g, '<meta name="robots" content="noindex,nofollow" />');
  html = replaceRequired(html, "canonical", /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/g, "");
  html = replaceRequired(html, "og:title", /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/g, `<meta property="og:title" content="${title}" />`);
  html = replaceRequired(html, "og:description", /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/g, `<meta property="og:description" content="${description}" />`);
  html = replaceRequired(html, "og:url", /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/g, "");
  html = replaceRequired(html, "twitter:title", /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/g, `<meta name="twitter:title" content="${title}" />`);
  html = replaceRequired(html, "twitter:description", /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/g, `<meta name="twitter:description" content="${description}" />`);
  return html;
}

const template = await readFile(templatePath, "utf8");

for (const route of STANDARD_PUBLIC_ROUTES) {
  const relativeDirectory = route.path === "/" ? "" : route.path.replace(/^\/+|\/+$/g, "");
  const outputDirectory = path.join(distRoot, relativeDirectory);
  const outputPath = path.join(outputDirectory, "index.html");
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, renderRouteShell(template, route), "utf8");
}

await writeFile(path.join(distRoot, "404.html"), renderNotFoundShell(template), "utf8");

console.log(`[static-route-shells] ${STANDARD_PUBLIC_ROUTES.length}개 공개 경로 셸과 404 셸 생성 완료`);
