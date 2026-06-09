import assert from "node:assert/strict";
import test from "node:test";
import {
  getAccessCodeFailureMessage,
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

test("access code failures give an actionable quota message", () => {
  assert.equal(
    getAccessCodeFailureMessage({ code: "resource-exhausted" }),
    "Firestore 일일 사용량 한도 초과로 접속 코드를 검증하지 못했습니다. Firebase 사용량이 리셋된 뒤 다시 시도해 주세요.",
  );
});
