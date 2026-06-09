import assert from "node:assert/strict";
import test from "node:test";
import {
  buildResourceFileDraft,
  buildResourceRecord,
  formatResourceFileSize,
  getSafeStorageFileName,
} from "./resourceFiles";

test("buildResourceFileDraft derives title, size, and type from the selected upload file", () => {
  const draft = buildResourceFileDraft({
    name: "K-포스 설치 매뉴얼.pdf",
    size: 1536,
    type: "application/pdf",
  });

  assert.deepEqual(draft, {
    title: "K-포스 설치 매뉴얼",
    downloadUrl: "",
    fileSize: "1.5 KB",
    fileType: "PDF / Manual",
  });
});

test("buildResourceRecord keeps the storage path so deleting a resource can remove the uploaded file", () => {
  const record = buildResourceRecord(
    {
      title: "통합 드라이버",
      description: "설치 파일",
      downloadUrl: "https://storage.example/driver.zip",
      fileSize: "12.0 MB",
      fileType: "ZIP / Driver",
      storagePath: "resources/admin/1710000000000_driver.zip",
    },
    {
      authorName: "대표 관리자",
      createdAt: "2026-06-09T10:00:00.000Z",
    }
  );

  assert.equal(record.storagePath, "resources/admin/1710000000000_driver.zip");
  assert.equal(record.downloadUrl, "https://storage.example/driver.zip");
  assert.equal(record.authorName, "대표 관리자");
});

test("formatResourceFileSize and getSafeStorageFileName produce stable upload metadata", () => {
  assert.equal(formatResourceFileSize(0), "0 B");
  assert.equal(formatResourceFileSize(1024 * 1024 * 2.5), "2.5 MB");
  assert.equal(getSafeStorageFileName(" driver setup:2026?.exe "), "driver_setup_2026_.exe");
});
