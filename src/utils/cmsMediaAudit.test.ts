import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { CMSPage, Product } from "../types";
import { auditCMSMediaForPublication } from "./cmsMediaAudit";
import { BLOCKED_PUBLIC_MEDIA, BLOCKED_PUBLIC_MEDIA_PREFIXES } from "./publicMedia";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const publicRoot = path.join(projectRoot, "public");

function pageWith(blocks: CMSPage["blocks"]): CMSPage[] {
  return [{ id: "home", title: "홈", slug: "home", blocks, isCustom: false, createdAt: "2026-07-18" }];
}

test("partner project assets remain blocked until redistribution rights are verified", () => {
  const issues = auditCMSMediaForPublication(pageWith([
    { id: "hero", type: "hero", title: "히어로", imageUrl: "/assets/product/toss-front.webp" },
  ]));

  assert.equal(issues.length, 1);
  assert.match(issues[0].reason, /재배포 권리/);
});

test("project-owned generated media can publish without duplicate CMS metadata", () => {
  const issues = auditCMSMediaForPublication(pageWith([
    { id: "hero", type: "hero", title: "히어로", imageUrl: "/assets/generated/topinfo-package-owner-v2.webp" },
  ]));

  assert.deepEqual(issues, []);
});

test("unregistered local media requires explicit source and verified rights", () => {
  const blocked = auditCMSMediaForPublication(pageWith([
    { id: "hero", type: "hero", title: "히어로", imageUrl: "/assets/custom/operator-upload.webp" },
  ]));
  assert.equal(blocked.length, 2);

  const verified = auditCMSMediaForPublication(pageWith([
    {
      id: "hero",
      type: "hero",
      title: "히어로",
      imageUrl: "/assets/custom/operator-upload.webp",
      imageSourceUrl: "partner-master:operator-upload",
      imageRightsStatus: "verified",
    },
  ]));
  assert.deepEqual(verified, []);
});

test("blocked project assets are rejected before the local asset shortcut", () => {
  const issues = auditCMSMediaForPublication(pageWith([
    { id: "hero", type: "hero", title: "히어로", imageUrl: "/assets/sector/feature-restaurant-receipt.png" },
  ]));

  assert.equal(issues.length, 1);
  assert.match(issues[0].reason, /공개 차단 자산/);
});

test("external CMS media is blocked without source and verified rights", () => {
  const issues = auditCMSMediaForPublication(pageWith([
    { id: "hero", type: "hero", title: "히어로", imageUrl: "https://example.com/custom.webp" },
  ]));

  assert.equal(issues.length, 2);
  assert.equal(issues.some((issue) => issue.reason.includes("원본 출처")), true);
  assert.equal(issues.some((issue) => issue.reason.includes("확인 완료")), true);
});

test("external CMS media passes only with an explicit source and verified rights", () => {
  const issues = auditCMSMediaForPublication(pageWith([
    {
      id: "hero",
      type: "hero",
      title: "히어로",
      imageUrl: "https://cdn.example.com/custom.webp",
      imageSourceUrl: "partner-master:campaign-2026-07",
      imageRightsStatus: "verified",
    },
  ]));

  assert.deepEqual(issues, []);
});

test("nested playlist and feature media are included in the publication gate", () => {
  const issues = auditCMSMediaForPublication(pageWith([
    {
      id: "sector",
      type: "features",
      title: "업종별",
      items: [{
        title: "카페",
        desc: "카페 운영",
        mediaPlaylist: [{ imageUrl: "blob:preview" }],
        detailGroups: [{
          id: "group",
          title: "기능",
          features: [{ id: "feature", title: "기능 이미지", imageUrl: "https://example.com/feature.png", imageRightsStatus: "pending" }],
        }],
      }],
    },
  ]));

  assert.equal(issues.some((issue) => issue.reason.includes("data/blob")), true);
  assert.equal(issues.some((issue) => issue.location.includes("기능 이미지")), true);
});

test("product media is included in the publication gate", () => {
  const product: Product = {
    id: "custom",
    name: "운영자 제품",
    category: "기타",
    description: "설명",
    features: [],
    specs: {},
    imageUrl: "https://example.com/product.png",
    createdAt: "2026-07-18",
  };

  const issues = auditCMSMediaForPublication([], [product]);
  assert.equal(issues.length, 2);
  assert.equal(issues.every((issue) => issue.location.includes("운영자 제품")), true);
});

test("blocked media cannot remain in the public publish directory", () => {
  for (const publicPath of Object.keys(BLOCKED_PUBLIC_MEDIA)) {
    if (!publicPath.startsWith("/assets/")) continue;
    const filePath = path.join(publicRoot, ...publicPath.slice(1).split("/"));
    assert.equal(existsSync(filePath), false, `${publicPath} must stay outside public/`);
  }

  for (const [publicPrefix] of BLOCKED_PUBLIC_MEDIA_PREFIXES) {
    const relativePrefix = publicPrefix.slice(1);
    const directory = path.join(publicRoot, path.dirname(relativePrefix));
    const filePrefix = path.basename(relativePrefix);
    const matches = existsSync(directory)
      ? readdirSync(directory).filter((name) => name.startsWith(filePrefix))
      : [];
    assert.deepEqual(matches, [], `${publicPrefix}* must stay outside public/`);
  }
});
