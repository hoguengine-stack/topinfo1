import assert from "node:assert/strict";
import test from "node:test";
import {
  getBoardLoadErrorMessage,
  isFirestoreQuotaError,
} from "./firebaseErrors";

test("isFirestoreQuotaError detects Firestore resource-exhausted errors", () => {
  assert.equal(isFirestoreQuotaError({ code: "resource-exhausted" }), true);
  assert.equal(isFirestoreQuotaError({ code: "firestore/resource-exhausted" }), true);
  assert.equal(isFirestoreQuotaError(new Error("Quota limit exceeded for Firestore")), true);
  assert.equal(isFirestoreQuotaError({ code: "permission-denied" }), false);
});

test("board load errors explain Firestore quota exhaustion", () => {
  assert.equal(
    getBoardLoadErrorMessage({ code: "resource-exhausted" }),
    "Firestore 일일 읽기 한도가 초과되어 게시판 목록을 불러오지 못했습니다. 한도가 리셋되면 자동으로 다시 조회됩니다.",
  );
});
