import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  getConsultationFieldErrors,
  getFirstErrorField,
  getPaperFieldErrors,
} from "./PublicForms";

const validConsultation = {
  customerName: "김대표",
  contact: "010-1234-5678",
  businessName: "탑카페",
  businessType: "카페·베이커리",
  projectType: "신규 오픈",
  installRegion: "경기 안산시",
  preferredTiming: "1개월 이내",
  productOfInterest: "인터넷 + 토스포스 패키지",
  message: "상담을 요청합니다.",
  privacyConsent: true,
  overseasTransferConsent: true,
};

const validPaperRequest = {
  customerName: "탑카페",
  contact: "031-487-4401",
  address: "경기도 안산시 상록구 천문로17 일영빌딩 2층",
  deviceModel: "",
  quantity: "1박스",
  privacyConsent: true,
  overseasTransferConsent: true,
};

test("consultation maps required fields and both consents to separate errors", () => {
  const errors = getConsultationFieldErrors({
    ...validConsultation,
    customerName: "",
    contact: "",
    privacyConsent: false,
    overseasTransferConsent: false,
  });

  assert.equal(errors.customerName, "담당자 성함을 입력해주세요.");
  assert.equal(errors.contact, "대표 연락처를 입력해주세요.");
  assert.equal(errors.privacyConsent, "개인정보 수집·이용 동의가 필요합니다.");
  assert.equal(errors.overseasTransferConsent, "Firebase 국외 처리 안내 동의가 필요합니다.");
  assert.equal(
    getFirstErrorField(errors, ["customerName", "contact", "privacyConsent", "overseasTransferConsent"]),
    "customerName",
  );
});

test("consultation reports an invalid telephone number on the telephone field", () => {
  const errors = getConsultationFieldErrors({ ...validConsultation, contact: "전화주세요" });

  assert.deepEqual(errors, { contact: "지역번호 또는 휴대전화 번호 형식으로 입력해주세요." });
});

test("paper request maps every required field and both consents separately", () => {
  const errors = getPaperFieldErrors({
    ...validPaperRequest,
    customerName: "",
    contact: "",
    address: "",
    privacyConsent: false,
    overseasTransferConsent: false,
  });

  assert.equal(errors.customerName, "가맹점 상호 또는 대표자 성함을 입력해주세요.");
  assert.equal(errors.contact, "수령 연락처를 입력해주세요.");
  assert.equal(errors.address, "배송지 주소를 입력해주세요.");
  assert.equal(errors.privacyConsent, "개인정보 수집·이용 동의가 필요합니다.");
  assert.equal(errors.overseasTransferConsent, "Firebase 국외 처리 안내 동의가 필요합니다.");
  assert.equal(
    getFirstErrorField(errors, ["customerName", "contact", "address", "privacyConsent"]),
    "customerName",
  );
});

test("valid consultation and paper requests have no field errors", () => {
  assert.deepEqual(getConsultationFieldErrors(validConsultation), {});
  assert.deepEqual(getPaperFieldErrors(validPaperRequest), {});
});

test("form controls expose field error descriptions and move focus to the first error", async () => {
  const source = await readFile(new URL("./PublicForms.tsx", import.meta.url), "utf8");

  assert.match(source, /aria-invalid=\{fieldErrors\.customerName \? true : undefined\}/);
  assert.match(source, /aria-describedby=\{describedBy\(fieldErrors\.contact,/);
  assert.match(source, /aria-invalid=\{errors\.privacyConsent \? true : undefined\}/);
  assert.match(source, /aria-describedby=\{describedBy\(errors\.overseasTransferConsent,/);
  assert.match(source, /fieldRefs\.current\[firstErrorField\]\?\.focus\(\)/);
  assert.match(source, /개인정보처리방침 전문 보기/);
  assert.match(source, /<LegalDocumentModal type="privacy" company=\{company\}/);
});
