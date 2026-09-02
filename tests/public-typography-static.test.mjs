import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const mainSource = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
const typographyCss = readFileSync(new URL("../src/styles/public-typography.css", import.meta.url), "utf8");
const footerSource = readFileSync(new URL("../src/components/WebsiteFooter.tsx", import.meta.url), "utf8");

test("public typography contract is loaded after page-specific public styles", () => {
  const typographyImport = mainSource.indexOf('import "./styles/public-typography.css";');
  assert.notEqual(typographyImport, -1);
  assert.ok(typographyImport > mainSource.indexOf('import "./styles/public-pages-redesign.css";'));
  assert.ok(typographyImport > mainSource.indexOf('import "./styles/public-home-system-redesign.css";'));
});

test("public typography uses a fixed breakpoint scale instead of viewport-scaled type", () => {
  for (const token of [
    "--topinfo-type-display",
    "--topinfo-type-section",
    "--topinfo-type-subsection",
    "--topinfo-type-card-title",
    "--topinfo-type-body-large",
    "--topinfo-type-body",
    "--topinfo-type-small",
    "--topinfo-type-meta",
  ]) {
    assert.match(typographyCss, new RegExp(`${token}:\\s*\\d+px`));
  }

  assert.doesNotMatch(typographyCss, /--topinfo-type-[^:]+:\s*[^;]*(?:vw|vh|vmin|vmax)/);
});

test("telephone, email, and company identifiers are protected from internal wrapping", () => {
  assert.match(typographyCss, /a\[href\^="tel:"\]/);
  assert.match(typographyCss, /a\[href\^="mailto:"\]/);
  assert.match(typographyCss, /\.public-data-token/);
  assert.match(typographyCss, /white-space:\s*nowrap/);
  assert.match(footerSource, /public-footer__company-item public-data-token/);
});
