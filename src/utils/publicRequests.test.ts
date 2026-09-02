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
      requestKind: " 매장 구성 상담 ",
      projectType: " 신규 오픈 ",
      installRegion: " 경기 안산시 ",
      preferredTiming: " 2주 이내 ",
      productOfInterest: " 포스 ",
      message: " 신규 문의 ",
      privacyConsent: true,
      overseasTransferConsent: true,
    },
    "2026-06-09T10:00:00.000Z"
  );

  assert.deepEqual(request, {
    customerName: "김대표",
    contact: "010-1111-2222",
    businessName: "탑식당",
    businessType: "일반음식점",
    requestKind: "매장 구성 상담",
    projectType: "신규 오픈",
    installRegion: "경기 안산시",
    preferredTiming: "2주 이내",
    productOfInterest: "포스",
    message: "신규 문의",
    status: "대기",
    createdAt: "2026-06-09T10:00:00.000Z",
    privacyConsentAt: "2026-06-09T10:00:00.000Z",
    overseasTransferConsentAt: "2026-06-09T10:00:00.000Z",
    privacyPolicyVersion: "2026-07-11",
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
      privacyConsent: true,
      overseasTransferConsent: true,
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
  assert.equal(
    getConsultationValidationError({
      customerName: "김대표",
      contact: "010-1234-5678",
      privacyConsent: true,
      overseasTransferConsent: true,
    }),
    null,
  );
  assert.equal(
    getConsultationValidationError({ customerName: "김대표", contact: "010-1234-5678" }),
    "개인정보 수집·이용 및 국외 처리 동의가 필요합니다.",
  );
  assert.equal(
    getPaperRequestValidationError({ customerName: "김대표", contact: "", address: "" }),
    "가맹점 상호/대표자 성함, 수령 연락처, 배송지 주소를 모두 작성해주세요."
  );
  assert.equal(
    getPaperRequestValidationError({
      customerName: "김대표",
      contact: "031-487-4401",
      address: "서울",
      privacyConsent: true,
      overseasTransferConsent: true,
    }),
    null,
  );
  assert.equal(
    getConsultationValidationError({
      customerName: "김대표",
      contact: "010",
      privacyConsent: true,
      overseasTransferConsent: true,
    }),
    "연락처를 지역번호 또는 휴대전화 번호 형식으로 작성해주세요.",
  );
});

test("request builders refuse to mint consent timestamps for invalid input", () => {
  assert.throws(
    () => buildConsultationRequest({ customerName: "김대표", contact: "010-1234-5678" }, "2026-06-09T10:00:00.000Z"),
    /개인정보 수집·이용 및 국외 처리 동의/,
  );
  assert.throws(
    () => buildPaperRequest({
      customerName: "탑카페",
      contact: "010-3333-4444",
      address: "서울 구로구",
      privacyConsent: true,
      overseasTransferConsent: true,
      deviceModel: "A".repeat(121),
    }, "2026-06-09T10:00:00.000Z"),
    /글자 수/,
  );
});
