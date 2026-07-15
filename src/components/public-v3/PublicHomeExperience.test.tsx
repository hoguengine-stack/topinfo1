import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createDefaultCMSPages } from "../../utils/cmsSettings";
import { PublicHomeExperience } from "./PublicHomeExperience";

test("public home renders the seven-chapter design without fake status UI", () => {
  const pages = createDefaultCMSPages("fixed-date");
  const page = pages.find((item) => item.id === "home");
  assert.ok(page);

  const html = renderToStaticMarkup(<PublicHomeExperience page={page} pages={pages} onNavigate={() => {}} />);
  [
    "top-home-hero",
    "top-home-responsibility",
    "top-home-system__stage",
    "top-home-package__offer",
    "top-home-sector__story",
    "top-home-process",
    "top-home-support",
    "top-home-faq",
    "top-home-cta",
  ].forEach((className) => assert.equal(html.includes(className), true, `missing ${className}`));
  assert.equal((html.match(/<section/g) || []).length, 7);
  assert.equal(html.includes("posbank-apexa-x-white-toss.png"), true);
  assert.equal(html.includes("toss-front-customer-payment.png"), true);
  assert.equal(html.includes("ahapos-white-printer.png"), true);
  assert.equal(html.includes("apexa-x-visual__screen"), true);
  assert.equal(html.includes("topinfo-package-owner-v2.webp"), true);
  assert.equal(html.includes("일반 월 43,000원"), true);
  assert.equal(html.includes("사용 교육"), true);
  assert.equal(html.includes("관련 기능 장면이 자동으로 이어집니다."), true);
  assert.equal(html.includes("/assets/sector/sector-cafe.webp"), true);
  assert.equal(html.includes("/assets/sector/sector-cafe-static.webp"), false);
  assert.equal(html.includes("top-home-package__included"), true);
  assert.equal(html.includes("U+ 인터넷전화</strong>"), false);
  assert.equal(html.includes("top-home-sector__media-nav"), true);
  assert.equal(html.includes("매장 운영 연결 완료"), false);
  assert.equal(html.includes("LIVE STORE PREVIEW"), false);
  assert.equal(html.includes("SCROLL TO SYSTEM"), false);
});

test("home sector is a first-class editable CMS scene", () => {
  const pages = createDefaultCMSPages("fixed-date");
  const page = pages.find((item) => item.id === "home");
  assert.ok(page);

  const html = renderToStaticMarkup(
    <PublicHomeExperience
      page={page}
      pages={pages}
      onNavigate={() => {}}
      renderScene={(block, scene) => <div data-scene-id={block.id}>{scene}</div>}
    />,
  );

  assert.equal(html.includes('data-scene-id="home-sector"'), true);
});

test("home system renders an operator image even when its scene kind is other", () => {
  const pages = createDefaultCMSPages("fixed-date");
  const original = pages.find((item) => item.id === "home");
  assert.ok(original);
  const blocks = original.blocks.map((block) => block.id === "home-internet"
    ? {
        ...block,
        items: [{
          title: "운영자 맞춤 서비스",
          desc: "직접 등록한 장면",
          mediaKind: "other" as const,
          imageUrl: "https://example.com/operator-scene.webp",
          imageAlt: "운영자가 등록한 맞춤 서비스 장면",
        }],
      }
    : block);
  const page = { ...original, blocks };

  const html = renderToStaticMarkup(<PublicHomeExperience page={page} pages={pages} onNavigate={() => {}} />);
  assert.equal(html.includes("https://example.com/operator-scene.webp"), true);
  assert.equal(html.includes("운영자가 등록한 맞춤 서비스 장면"), true);
});

test("home CCTV scene has no generated human and renders a four-view phone with official cameras", () => {
  const pages = createDefaultCMSPages("fixed-date");
  const original = pages.find((item) => item.id === "home");
  assert.ok(original);
  const blocks = original.blocks.map((block) => block.id === "home-internet"
    ? { ...block, items: block.items?.filter((item) => item.mediaKind === "cctv") }
    : block);
  const html = renderToStaticMarkup(<PublicHomeExperience page={{ ...original, blocks }} pages={pages} onNavigate={() => {}} />);
  assert.equal(html.includes("top-home-cctv-scene__phone"), true);
  assert.equal(html.includes("cctv-store-grid-person-free.png"), true);
  ["출입구", "카운터", "매장 안", "창고"].forEach((label) => assert.equal(html.includes(label), true));
  assert.equal(html.includes("system-cctv.webp"), false);
  assert.equal(html.includes("uplus-cctv-indoor.png"), true);
  assert.equal(html.includes("uplus-cctv-outdoor.png"), true);
  assert.equal(html.includes("uplus-cctv-ptz.png"), true);
});

test("flagship home follows CMS block order and keeps custom fallback blocks", () => {
  const pages = createDefaultCMSPages("fixed-date");
  const original = pages.find((item) => item.id === "home");
  assert.ok(original);
  const hero = original.blocks.find((block) => block.id === "home-hero");
  const support = original.blocks.find((block) => block.id === "home-support");
  assert.ok(hero);
  assert.ok(support);

  const custom = { id: "custom-home-copy", type: "text" as const, title: "운영자 추가 섹션" };
  const page = { ...original, blocks: [support, custom, hero] };
  const html = renderToStaticMarkup(
    <PublicHomeExperience
      page={page}
      pages={pages}
      onNavigate={() => {}}
      renderFallback={(block) => <section className="custom-fallback">{block.title}</section>}
    />,
  );

  assert.ok(html.indexOf("top-home-support") < html.indexOf("custom-fallback"));
  assert.ok(html.indexOf("custom-fallback") < html.indexOf("top-home-hero"));
});
