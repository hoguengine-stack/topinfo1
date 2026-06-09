import assert from "node:assert/strict";
import test from "node:test";
import {
  createDefaultCMSPages,
  getNavigationLabel,
  getOrderedVisiblePages,
  mergeBlockFields,
  restoreStandardCMSPages,
} from "./cmsSettings";
import { CMSBlock, CMSPage, NavigationSettings } from "../types";

const pages: CMSPage[] = [
  { id: "home", slug: "home", title: "홈", isCustom: false, createdAt: "now", blocks: [] },
  { id: "products", slug: "products", title: "제품군소개", isCustom: false, createdAt: "now", blocks: [] },
  { id: "request_consult", slug: "request_consult", title: "가맹상담", isCustom: false, createdAt: "now", blocks: [] },
  { id: "custom", slug: "custom", title: "커스텀", isCustom: true, createdAt: "now", blocks: [] },
];

test("navigation settings hide and order visible pages", () => {
  const settings: NavigationSettings = {
    home: { label: "첫 화면", visible: true, order: 2 },
    products: { visible: false, order: 1 },
    request_consult: { visible: true, order: 0 },
    custom: { visible: true, order: 3 },
  };

  const ordered = getOrderedVisiblePages(pages, settings);

  assert.deepEqual(ordered.map((page) => page.slug), ["request_consult", "home", "custom"]);
  assert.equal(getNavigationLabel(pages[0], settings), "첫 화면");
});

test("mergeBlockFields updates only the selected block", () => {
  const blocks: CMSBlock[] = [
    { id: "a", type: "hero", title: "A" },
    { id: "b", type: "image", title: "B", imageWidth: "100px" },
  ];

  const updated = mergeBlockFields(blocks, "b", { imageWidth: "320px", imageHeight: "180px" });

  assert.equal(updated[0], blocks[0]);
  assert.deepEqual(updated[1], { id: "b", type: "image", title: "B", imageWidth: "320px", imageHeight: "180px" });
  assert.notEqual(updated[1], blocks[1]);
});

test("default CMS pages provide renderable public homepage content", () => {
  const defaultPages = createDefaultCMSPages("fixed-date");
  const home = defaultPages.find((page) => page.id === "home");

  assert.ok(home);
  assert.equal(home.slug, "home");
  assert.ok(home.blocks.length >= 1);
  assert.equal(home.createdAt, "fixed-date");
});

test("restoreStandardCMSPages fills missing and empty standard pages", () => {
  const defaultPages = createDefaultCMSPages("fixed-date");
  const restored = restoreStandardCMSPages(
    [
      { id: "home", slug: "home", title: "홈 수정본", isCustom: false, createdAt: "old", blocks: [] },
      {
        id: "custom",
        slug: "custom",
        title: "커스텀",
        isCustom: true,
        createdAt: "old",
        blocks: [{ id: "custom-text", type: "text", content: "유지" }],
      },
    ],
    defaultPages,
  );

  const home = restored.find((page) => page.id === "home");
  const products = restored.find((page) => page.id === "products");
  const custom = restored.find((page) => page.id === "custom");

  assert.ok(home);
  assert.equal(home.title, "홈 수정본");
  assert.ok(home.blocks.length >= 1);
  assert.ok(products);
  assert.ok(custom);
  assert.deepEqual(custom.blocks, [{ id: "custom-text", type: "text", content: "유지" }]);
});
