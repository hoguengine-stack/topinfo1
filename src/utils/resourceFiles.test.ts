import assert from "node:assert/strict";
import test from "node:test";
import {
  buildResourceRecord,
  buildStaticDownloadDraft,
  formatResourceFileSize,
  normalizeStaticDownloadUrl,
} from "./resourceFiles";

test("buildResourceRecord keeps the static download path for GitHub-hosted resource files", () => {
  const record = buildResourceRecord(
    {
      title: "통합 드라이버",
      description: "설치 파일",
      downloadUrl: "/downloads/driver.zip",
      fileSize: "12.0 MB",
      fileType: "ZIP / Driver",
    },
    {
      authorName: "대표 관리자",
      authorId: "admin-uid",
      createdAt: "2026-06-09T10:00:00.000Z",
    }
  );

  assert.equal(record.downloadUrl, "/downloads/driver.zip");
  assert.equal(record.authorName, "대표 관리자");
  assert.equal(record.authorId, "admin-uid");
});

test("formatResourceFileSize produces stable file size labels", () => {
  assert.equal(formatResourceFileSize(0), "0 B");
  assert.equal(formatResourceFileSize(1024 * 1024 * 2.5), "2.5 MB");
});

test("normalizeStaticDownloadUrl converts repo download paths into public site URLs", () => {
  assert.equal(normalizeStaticDownloadUrl("public/downloads/driver setup.exe"), "/downloads/driver%20setup.exe");
  assert.equal(normalizeStaticDownloadUrl("downloads/manual.pdf"), "/downloads/manual.pdf");
  assert.equal(normalizeStaticDownloadUrl("/downloads/manual.pdf"), "/downloads/manual.pdf");
  assert.equal(normalizeStaticDownloadUrl("https://example.com/file.zip"), "https://example.com/file.zip");
});

test("buildStaticDownloadDraft derives metadata from a GitHub static download path", () => {
  const draft = buildStaticDownloadDraft("public/downloads/K-포스 설치 매뉴얼.pdf", "1.5 MB");

  assert.deepEqual(draft, {
    title: "K-포스 설치 매뉴얼",
    downloadUrl: "/downloads/K-%ED%8F%AC%EC%8A%A4%20%EC%84%A4%EC%B9%98%20%EB%A7%A4%EB%89%B4%EC%96%BC.pdf",
    fileSize: "1.5 MB",
    fileType: "PDF / Manual",
  });
});

test("buildStaticDownloadDraft uses download manifest metadata when available", () => {
  const draft = buildStaticDownloadDraft("downloads/driver.zip", "", [
    {
      path: "/downloads/driver.zip",
      size: "12.0 MB",
      title: "통합 설치 드라이버",
      type: "ZIP / Driver",
    },
  ]);

  assert.deepEqual(draft, {
    title: "통합 설치 드라이버",
    downloadUrl: "/downloads/driver.zip",
    fileSize: "12.0 MB",
    fileType: "ZIP / Driver",
  });
});
