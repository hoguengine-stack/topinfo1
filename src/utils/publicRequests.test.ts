import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConsultationRequest,
  buildPaperRequest,
  getConsultationValidationError,
  getPaperRequestValidationError,
} from "./publicRequests";

test("buildConsultationRequest trims public consultation fields and keeps only Firestore rule fields", () => {
  const request = buildConsultationRequest(
    {
      customerName: "  김대표  ",
      contact: " 010-1111-2222 ",
      businessName: " 탑식당 ",
      businessType: " 일반음식점 ",
      productOfInterest: " 포스 ",
      message: " 신규 문의 ",
    },
    "2026-06-09T10:00:00.000Z"
  );

  assert.deepEqual(request, {
    customerName: "김대표",
    contact: "010-1111-2222",
    businessName: "탑식당",
    businessType: "일반음식점",
    productOfInterest: "포스",
    message: "신규 문의",
    status: "대기",
    createdAt: "2026-06-09T10:00:00.000Z",
  });
});

test("buildPaperRequest trims required delivery fields", () => {
  const request = buildPaperRequest(
    {
      customerName: " 탑카페 ",
      contact: " 010-3333-4444 ",
      address: " 서울 구로구 ",
      deviceModel: " K-30 ",
      quantity: " 2박스 (100롤) ",
    },
    "2026-06-09T10:00:00.000Z"
  );

  assert.equal(request.customerName, "탑카페");
  assert.equal(request.contact, "010-3333-4444");
  assert.equal(request.address, "서울 구로구");
  assert.equal(request.status, "대기");
});

test("public request validation reports missing required fields before Firestore writes", () => {
  assert.equal(getConsultationValidationError({ customerName: "", contact: "" }), "담당자 성함과 대표 연락처를 작성해주세요.");
  assert.equal(getConsultationValidationError({ customerName: "김대표", contact: "010" }), null);
  assert.equal(
    getPaperRequestValidationError({ customerName: "김대표", contact: "", address: "" }),
    "가맹점 상호/대표자 성함, 수령 연락처, 배송지 주소를 모두 작성해주세요."
  );
  assert.equal(getPaperRequestValidationError({ customerName: "김대표", contact: "010", address: "서울" }), null);
});
