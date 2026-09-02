import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildPublicLocation,
  getPublicCanonicalUrl,
  getPublicSlugFromLocation,
  getPublicTargetHref,
  PUBLIC_NOT_FOUND_SLUG,
  STANDARD_PUBLIC_ROUTES,
} from "./publicRoutes";

test("표준 공개 경로의 슬러그와 경로는 중복되지 않는다", () => {
  assert.equal(STANDARD_PUBLIC_ROUTES.length, 12);
  assert.equal(new Set(STANDARD_PUBLIC_ROUTES.map((route) => route.slug)).size, 12);
  assert.equal(new Set(STANDARD_PUBLIC_ROUTES.map((route) => route.path)).size, 12);
});

test("sitemap은 모든 표준 공개 경로를 한 번씩 포함한다", () => {
  const sitemap = readFileSync(new URL("../../public/sitemap.xml", import.meta.url), "utf8");

  for (const route of STANDARD_PUBLIC_ROUTES) {
    const canonical = getPublicCanonicalUrl(route.slug);
    assert.equal(sitemap.split(`<loc>${canonical}</loc>`).length - 1, 1, `${canonical} sitemap count`);
  }
});

test("표준 path와 기존 page query를 같은 슬러그로 해석한다", () => {
  assert.equal(getPublicSlugFromLocation("/products/"), "products");
  assert.equal(getPublicSlugFromLocation("/products"), "products");
  assert.equal(getPublicSlugFromLocation("/industries/"), "industries");
  assert.equal(getPublicSlugFromLocation("/promotion/pos"), "promotion_pos");
  assert.equal(getPublicSlugFromLocation("/promotion/used-pos/"), "used_pos");
  assert.equal(getPublicSlugFromLocation("/support/"), "support");
  assert.equal(getPublicSlugFromLocation("/", "?page=toss_pos&sector=restaurant"), "toss_pos");
  assert.equal(getPublicSlugFromLocation("/", "?page=custom_campaign"), "custom_campaign");
  assert.equal(getPublicSlugFromLocation("/", "?page=admin"), "admin");
  assert.equal(getPublicSlugFromLocation("/등록되지-않은-주소/"), PUBLIC_NOT_FOUND_SLUG);
});

test("표준 링크는 path를 사용하고 admin과 CMS 사용자 정의 페이지는 query를 유지한다", () => {
  assert.equal(getPublicTargetHref("home"), "/");
  assert.equal(getPublicTargetHref("toss_pos?sector=restaurant"), "/toss-pos/?sector=restaurant");
  assert.equal(getPublicTargetHref("request_consult"), "/contact/");
  assert.equal(getPublicTargetHref("promotion_pos"), "/promotion/pos/");
  assert.equal(getPublicTargetHref("admin"), "/?page=admin");
  assert.equal(getPublicTargetHref("custom_campaign?source=header"), "/?source=header&page=custom_campaign");
});

test("기존 query URL을 표준 path로 바꿀 때 page만 제거하고 나머지 상태를 보존한다", () => {
  assert.equal(
    buildPublicLocation("toss_pos", "?page=toss_pos&sector=retail", "#details"),
    "/toss-pos/?sector=retail#details",
  );
  assert.equal(getPublicCanonicalUrl("board_resources"), "https://topinfo.co.kr/support/resources/");
});
