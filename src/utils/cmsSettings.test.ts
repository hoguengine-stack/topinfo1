import assert from "node:assert/strict";
import test from "node:test";
import {
  getNavigationLabel,
  getOrderedVisiblePages,
  mergeBlockFields,
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
