import React, { useEffect, useRef, useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { Check, ChevronRight, LoaderCircle, PackageCheck, Send, ShieldCheck } from "lucide-react";
import { db } from "../../firebase";
import { DEFAULT_FOOTER_INFO, type FooterInfo } from "../../utils/footerSettings";
import {
  buildConsultationRequest,
  buildConsultationMessage,
  buildPaperRequest,
  getConsultationValidationError,
  getPaperRequestValidationError,
  PUBLIC_REQUEST_COLLECTIONS,
  PUBLIC_REQUEST_LIMITS,
} from "../../utils/publicRequests";
import { LegalDocumentModal } from "../LegalDocumentModal";

type SubmitState = "idle" | "submitting" | "success";

const initialConsultation = {
  customerName: "",
  contact: "",
  businessName: "",
  businessType: "",
  requestKind: "매장 구성 상담",
  projectType: "신규 오픈",
  installRegion: "",
  preferredTiming: "",
  productOfInterest: "인터넷 + 토스포스 패키지",
  message: "",
  privacyConsent: false,
  overseasTransferConsent: false,
};

const consultationIntentDefaults: Record<string, Partial<typeof initialConsultation>> = {
  promotion: {
    requestKind: "프로모션 조건 상담",
    productOfInterest: "현재 적용 가능한 프로모션",
  },
  used: {
    requestKind: "중고 POS 상담",
    projectType: "기존 POS 교체",
    productOfInterest: "중고 POS·교체 상담",
  },
  replace: {
    requestKind: "기존 POS 교체 상담",
    projectType: "기존 POS 교체",
    productOfInterest: "기존 매장 장비 교체",
  },
};

export function getInitialConsultation(search = "") {
  const intent = new URLSearchParams(search).get("intent") || "";
  return { ...initialConsultation, ...(consultationIntentDefaults[intent] || {}) };
}

type ConsultationFormInput = Omit<typeof initialConsultation, "requestKind"> & { requestKind?: string };

const initialPaperRequest = {
  customerName: "",
  contact: "",
  address: "",
  deviceModel: "",
  quantity: "1박스",
  privacyConsent: false,
  overseasTransferConsent: false,
};

type ConsultationErrorField =
  | "customerName"
  | "contact"
  | "businessName"
  | "businessType"
  | "projectType"
  | "installRegion"
  | "preferredTiming"
  | "productOfInterest"
  | "message"
  | "privacyConsent"
  | "overseasTransferConsent";

type PaperErrorField =
  | "customerName"
  | "contact"
  | "address"
  | "deviceModel"
  | "quantity"
  | "privacyConsent"
  | "overseasTransferConsent";

type FieldErrors<Field extends string> = Partial<Record<Field, string>>;
type FieldRefs<Field extends string> = Partial<Record<Field, HTMLElement | null>>;

const consultationErrorOrder: ConsultationErrorField[] = [
  "customerName",
  "contact",
  "businessName",
  "businessType",
  "projectType",
  "installRegion",
  "preferredTiming",
  "productOfInterest",
  "message",
  "privacyConsent",
  "overseasTransferConsent",
];

const paperErrorOrder: PaperErrorField[] = [
  "customerName",
  "contact",
  "address",
  "deviceModel",
  "quantity",
  "privacyConsent",
  "overseasTransferConsent",
];

function hasValidPhoneNumber(value: string) {
  const contact = value.trim();
  const digits = contact.replace(/\D/g, "");
  return /^[+\d][\d\s().-]*$/.test(contact) && digits.length >= 9 && digits.length <= 11;
}

function addLengthError<Field extends string>(
  errors: FieldErrors<Field>,
  field: Field,
  value: string,
  limit: number,
  label: string,
) {
  if (value.trim().length > limit) {
    errors[field] = `${label}은 ${limit.toLocaleString("ko-KR")}자 이내로 입력해주세요.`;
  }
}

export function getConsultationFieldErrors(form: ConsultationFormInput) {
  const errors: FieldErrors<ConsultationErrorField> = {};

  if (!form.customerName.trim()) errors.customerName = "담당자 성함을 입력해주세요.";
  if (!form.contact.trim()) {
    errors.contact = "대표 연락처를 입력해주세요.";
  } else if (!hasValidPhoneNumber(form.contact)) {
    errors.contact = "지역번호 또는 휴대전화 번호 형식으로 입력해주세요.";
  }

  addLengthError(errors, "customerName", form.customerName, PUBLIC_REQUEST_LIMITS.customerName, "담당자 성함");
  addLengthError(errors, "contact", form.contact, PUBLIC_REQUEST_LIMITS.contact, "대표 연락처");
  addLengthError(errors, "businessName", form.businessName, PUBLIC_REQUEST_LIMITS.businessName, "매장명");
  addLengthError(errors, "businessType", form.businessType, PUBLIC_REQUEST_LIMITS.businessType, "업종");
  addLengthError(errors, "projectType", form.projectType, PUBLIC_REQUEST_LIMITS.projectType, "준비 유형");
  addLengthError(errors, "installRegion", form.installRegion, PUBLIC_REQUEST_LIMITS.installRegion, "설치 지역");
  addLengthError(errors, "preferredTiming", form.preferredTiming, PUBLIC_REQUEST_LIMITS.preferredTiming, "희망 시기");
  addLengthError(
    errors,
    "productOfInterest",
    form.productOfInterest,
    PUBLIC_REQUEST_LIMITS.productOfInterest,
    "관심 구성",
  );
  if (buildConsultationMessage(form).length > PUBLIC_REQUEST_LIMITS.message) {
    errors.message = "문의 내용은 2,000자 이내로 입력해주세요.";
  }
  if (!form.privacyConsent) errors.privacyConsent = "개인정보 수집·이용 동의가 필요합니다.";
  if (!form.overseasTransferConsent) {
    errors.overseasTransferConsent = "Firebase 국외 처리 안내 동의가 필요합니다.";
  }
  return errors;
}

export function getPaperFieldErrors(form: typeof initialPaperRequest) {
  const errors: FieldErrors<PaperErrorField> = {};

  if (!form.customerName.trim()) errors.customerName = "가맹점 상호 또는 대표자 성함을 입력해주세요.";
  if (!form.contact.trim()) {
    errors.contact = "수령 연락처를 입력해주세요.";
  } else if (!hasValidPhoneNumber(form.contact)) {
    errors.contact = "지역번호 또는 휴대전화 번호 형식으로 입력해주세요.";
  }
  if (!form.address.trim()) errors.address = "배송지 주소를 입력해주세요.";

  addLengthError(errors, "customerName", form.customerName, PUBLIC_REQUEST_LIMITS.customerName, "상호 또는 대표자 성함");
  addLengthError(errors, "contact", form.contact, PUBLIC_REQUEST_LIMITS.contact, "수령 연락처");
  addLengthError(errors, "address", form.address, PUBLIC_REQUEST_LIMITS.address, "배송지 주소");
  addLengthError(errors, "deviceModel", form.deviceModel, PUBLIC_REQUEST_LIMITS.deviceModel, "단말기 모델");
  addLengthError(errors, "quantity", form.quantity, PUBLIC_REQUEST_LIMITS.quantity, "요청 수량");
  if (!form.privacyConsent) errors.privacyConsent = "개인정보 수집·이용 동의가 필요합니다.";
  if (!form.overseasTransferConsent) {
    errors.overseasTransferConsent = "Firebase 국외 처리 안내 동의가 필요합니다.";
  }
  return errors;
}

export function getFirstErrorField<Field extends string>(errors: FieldErrors<Field>, order: Field[]) {
  return order.find((field) => Boolean(errors[field]));
}

function describedBy(error: string | undefined, errorId: string) {
  return error ? errorId : undefined;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p id={id} className="public-form__error">{message}</p>;
}

function ConsentFields({
  privacyConsent,
  overseasTransferConsent,
  onChange,
  disabled,
  errors,
  idPrefix,
  privacyInputRef,
  overseasInputRef,
  onOpenPrivacy,
}: {
  privacyConsent: boolean;
  overseasTransferConsent: boolean;
  onChange: (field: "privacyConsent" | "overseasTransferConsent", value: boolean) => void;
  disabled: boolean;
  errors: FieldErrors<"privacyConsent" | "overseasTransferConsent">;
  idPrefix: string;
  privacyInputRef: React.Ref<HTMLInputElement>;
  overseasInputRef: React.Ref<HTMLInputElement>;
  onOpenPrivacy: () => void;
}) {
  const privacyErrorId = `${idPrefix}-privacy-consent-error`;
  const overseasErrorId = `${idPrefix}-overseas-transfer-consent-error`;

  return (
    <div className="public-form__consents">
      <button
        type="button"
        className="public-form__policy-link"
        onClick={onOpenPrivacy}
        disabled={disabled}
      >
        <ShieldCheck aria-hidden="true" />
        개인정보처리방침 전문 보기
      </button>
      <label>
        <input
          ref={privacyInputRef}
          type="checkbox"
          required
          checked={privacyConsent}
          disabled={disabled}
          aria-invalid={errors.privacyConsent ? true : undefined}
          aria-describedby={describedBy(errors.privacyConsent, privacyErrorId)}
          onChange={(event) => onChange("privacyConsent", event.target.checked)}
        />
        <span><strong>[필수]</strong> 상담 및 요청 처리를 위한 개인정보 수집·이용에 동의합니다.</span>
      </label>
      <FieldError id={privacyErrorId} message={errors.privacyConsent} />
      <label>
        <input
          ref={overseasInputRef}
          type="checkbox"
          required
          checked={overseasTransferConsent}
          disabled={disabled}
          aria-invalid={errors.overseasTransferConsent ? true : undefined}
          aria-describedby={describedBy(errors.overseasTransferConsent, overseasErrorId)}
          onChange={(event) => onChange("overseasTransferConsent", event.target.checked)}
        />
        <span><strong>[필수]</strong> Firebase를 통한 개인정보 국외 처리 안내에 동의합니다.</span>
      </label>
      <FieldError id={overseasErrorId} message={errors.overseasTransferConsent} />
    </div>
  );
}

function SuccessPanel({ title, message, onReset }: { title: string; message: string; onReset: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div ref={panelRef} className="public-form__success" role="status" aria-live="polite" tabIndex={-1}>
      <span className="public-form__success-icon"><Check aria-hidden="true" /></span>
      <p className="public-kicker">접수 완료</p>
      <h2>{title}</h2>
      <p>{message}</p>
      <button type="button" className="public-button public-button--secondary" onClick={onReset}>
        새 요청 작성 <ChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}

interface PublicFormProps {
  company?: FooterInfo;
}

export function PublicConsultationForm({ company = DEFAULT_FOOTER_INFO }: PublicFormProps) {
  const initialFormRef = useRef(
    getInitialConsultation(typeof window === "undefined" ? "" : window.location.search),
  );
  const [form, setForm] = useState(initialFormRef.current);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ConsultationErrorField>>({});
  const [showPrivacy, setShowPrivacy] = useState(false);
  const submitLockRef = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const fieldRefs = useRef<FieldRefs<ConsultationErrorField>>({});

  const setField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (error) setError("");
  };

  const focusFirstFieldError = (errors: FieldErrors<ConsultationErrorField>) => {
    const firstErrorField = getFirstErrorField(errors, consultationErrorOrder);
    if (!firstErrorField) return;
    window.requestAnimationFrame(() => fieldRefs.current[firstErrorField]?.focus());
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitLockRef.current) return;
    const validationError = getConsultationValidationError(form);
    if (validationError) {
      const nextFieldErrors = getConsultationFieldErrors(form);
      setFieldErrors(nextFieldErrors);
      setError(validationError);
      focusFirstFieldError(nextFieldErrors);
      return;
    }

    submitLockRef.current = true;
    setSubmitState("submitting");
    setFieldErrors({});
    setError("");
    try {
      await addDoc(
        collection(db, PUBLIC_REQUEST_COLLECTIONS.consultations),
        buildConsultationRequest(form, new Date().toISOString()),
      );
      setSubmitState("success");
    } catch (submitError) {
      console.error("Consultation request failed:", submitError);
      setError("접수 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 031-487-4401로 연락해주세요.");
      setSubmitState("idle");
      submitLockRef.current = false;
      window.requestAnimationFrame(() => errorRef.current?.focus());
    }
  };

  if (submitState === "success") {
    return (
      <SuccessPanel
        title="상담 요청이 접수되었습니다"
        message="남겨주신 연락처로 매장 환경과 설치 일정을 확인해 안내드리겠습니다."
        onReset={() => {
          submitLockRef.current = false;
          setError("");
          setFieldErrors({});
          setForm(initialFormRef.current);
          setSubmitState("idle");
        }}
      />
    );
  }

  return (
    <section className="public-form-shell" aria-labelledby="consultation-form-title">
      <aside className="public-form-aside">
        <p className="public-kicker">매장 오픈 상담</p>
        <h2 id="consultation-form-title">매장에 필요한 구성을 한 번에 확인하세요</h2>
        <p>인터넷 약정, 업종, 기존 장비를 확인한 뒤 필요한 항목만 정리해 안내합니다.</p>
        <ol>
          <li><span>01</span><div><strong>요청 접수</strong><small>상담 접수함에 안전하게 저장</small></div></li>
          <li><span>02</span><div><strong>조건 확인</strong><small>인터넷·장비·카드가맹 구성 확인</small></div></li>
          <li><span>03</span><div><strong>설치 일정 안내</strong><small>담당자가 연락해 다음 단계 확정</small></div></li>
        </ol>
        <a href="tel:0314874401" className="public-form-aside__contact">전화 상담 <strong>031-487-4401</strong></a>
      </aside>

      <form
        className="public-form"
        onSubmit={submit}
        noValidate
        aria-busy={submitState === "submitting"}
        aria-describedby={error ? "public-consultation-error" : undefined}
      >
        <div className="public-form__heading">
          <span>매장 구성 상담</span>
          <p>필수 항목만 입력해도 접수할 수 있습니다.</p>
        </div>
        <div className="public-form__grid">
          <label>
            <span>담당자 성함 <b>*</b></span>
            <input
              ref={(node) => { fieldRefs.current.customerName = node; }}
              id="consultation-customer-name"
              required
              maxLength={PUBLIC_REQUEST_LIMITS.customerName}
              value={form.customerName}
              aria-invalid={fieldErrors.customerName ? true : undefined}
              aria-describedby={describedBy(fieldErrors.customerName, "consultation-customer-name-error")}
              onChange={(e) => setField("customerName", e.target.value)}
              placeholder="홍길동"
              autoComplete="name"
            />
            <FieldError id="consultation-customer-name-error" message={fieldErrors.customerName} />
          </label>
          <label>
            <span>대표 연락처 <b>*</b></span>
            <input
              ref={(node) => { fieldRefs.current.contact = node; }}
              id="consultation-contact"
              type="tel"
              required
              maxLength={PUBLIC_REQUEST_LIMITS.contact}
              value={form.contact}
              aria-invalid={fieldErrors.contact ? true : undefined}
              aria-describedby={describedBy(fieldErrors.contact, "consultation-contact-error")}
              onChange={(e) => setField("contact", e.target.value)}
              placeholder="010-0000-0000"
              inputMode="tel"
              autoComplete="tel"
            />
            <FieldError id="consultation-contact-error" message={fieldErrors.contact} />
          </label>
          <label>
            <span>매장명</span>
            <input
              ref={(node) => { fieldRefs.current.businessName = node; }}
              maxLength={PUBLIC_REQUEST_LIMITS.businessName}
              value={form.businessName}
              aria-invalid={fieldErrors.businessName ? true : undefined}
              aria-describedby={describedBy(fieldErrors.businessName, "consultation-business-name-error")}
              onChange={(e) => setField("businessName", e.target.value)}
              placeholder="예: 탑카페 안산점"
            />
            <FieldError id="consultation-business-name-error" message={fieldErrors.businessName} />
          </label>
          <label>
            <span>업종</span>
            <select
              ref={(node) => { fieldRefs.current.businessType = node; }}
              value={form.businessType}
              aria-invalid={fieldErrors.businessType ? true : undefined}
              aria-describedby={describedBy(fieldErrors.businessType, "consultation-business-type-error")}
              onChange={(e) => setField("businessType", e.target.value)}
            >
              <option value="">선택해주세요</option>
              <option>카페·베이커리</option>
              <option>음식점·주점</option>
              <option>소매·편의점</option>
              <option>뷰티·서비스</option>
              <option>기타</option>
            </select>
            <FieldError id="consultation-business-type-error" message={fieldErrors.businessType} />
          </label>
          <label>
            <span>준비 유형</span>
            <select
              ref={(node) => { fieldRefs.current.projectType = node; }}
              value={form.projectType}
              aria-invalid={fieldErrors.projectType ? true : undefined}
              aria-describedby={describedBy(fieldErrors.projectType, "consultation-project-type-error")}
              onChange={(e) => setField("projectType", e.target.value)}
            >
              <option>신규 오픈</option>
              <option>기존 POS 교체</option>
              <option>장비 추가·연동</option>
              <option>이전 설치</option>
              <option>기타</option>
            </select>
            <FieldError id="consultation-project-type-error" message={fieldErrors.projectType} />
          </label>
          <label>
            <span>설치 지역</span>
            <input
              ref={(node) => { fieldRefs.current.installRegion = node; }}
              maxLength={PUBLIC_REQUEST_LIMITS.installRegion}
              value={form.installRegion}
              aria-invalid={fieldErrors.installRegion ? true : undefined}
              aria-describedby={describedBy(fieldErrors.installRegion, "consultation-install-region-error")}
              onChange={(e) => setField("installRegion", e.target.value)}
              placeholder="예: 경기 안산시 상록구"
              autoComplete="address-level2"
            />
            <FieldError id="consultation-install-region-error" message={fieldErrors.installRegion} />
          </label>
          <label>
            <span>희망 시기</span>
            <select
              ref={(node) => { fieldRefs.current.preferredTiming = node; }}
              value={form.preferredTiming}
              aria-invalid={fieldErrors.preferredTiming ? true : undefined}
              aria-describedby={describedBy(fieldErrors.preferredTiming, "consultation-preferred-timing-error")}
              onChange={(e) => setField("preferredTiming", e.target.value)}
            >
              <option value="">선택해주세요</option>
              <option>1주 이내</option>
              <option>2주 이내</option>
              <option>1개월 이내</option>
              <option>1개월 이후</option>
              <option>일정 상담 필요</option>
            </select>
            <FieldError id="consultation-preferred-timing-error" message={fieldErrors.preferredTiming} />
          </label>
          <label className="public-form__wide">
            <span>관심 구성</span>
            <select
              ref={(node) => { fieldRefs.current.productOfInterest = node; }}
              value={form.productOfInterest}
              aria-invalid={fieldErrors.productOfInterest ? true : undefined}
              aria-describedby={describedBy(fieldErrors.productOfInterest, "consultation-product-interest-error")}
              onChange={(e) => setField("productOfInterest", e.target.value)}
            >
              <option>인터넷 + 토스포스 패키지</option>
              <option>토스포스·토스프론트</option>
              <option>카드단말기·키오스크</option>
              <option>LG U+ 인터넷 개통</option>
              <option>U+ AI전화</option>
              <option>U+ 지능형 CCTV</option>
              <option>U+ 인터넷전화</option>
              <option>기존 매장 장비 교체</option>
              <option>중고 POS·교체 상담</option>
              <option>현재 적용 가능한 프로모션</option>
            </select>
            <FieldError id="consultation-product-interest-error" message={fieldErrors.productOfInterest} />
          </label>
          <label className="public-form__wide">
            <span>문의 내용</span>
            <textarea
              ref={(node) => { fieldRefs.current.message = node; }}
              maxLength={PUBLIC_REQUEST_LIMITS.message}
              value={form.message}
              aria-invalid={fieldErrors.message ? true : undefined}
              aria-describedby={describedBy(fieldErrors.message, "consultation-message-error")}
              onChange={(e) => setField("message", e.target.value)}
              placeholder="매장 위치, 오픈 예정일, 현재 사용 중인 장비 등을 알려주시면 더 정확히 안내할 수 있습니다."
              rows={5}
            />
            <FieldError id="consultation-message-error" message={fieldErrors.message} />
          </label>
        </div>
        <ConsentFields
          privacyConsent={form.privacyConsent}
          overseasTransferConsent={form.overseasTransferConsent}
          onChange={(field, value) => setField(field, value)}
          disabled={submitState === "submitting"}
          errors={fieldErrors}
          idPrefix="consultation"
          privacyInputRef={(node) => { fieldRefs.current.privacyConsent = node; }}
          overseasInputRef={(node) => { fieldRefs.current.overseasTransferConsent = node; }}
          onOpenPrivacy={() => setShowPrivacy(true)}
        />
        {error && <p ref={errorRef} id="public-consultation-error" className="public-form__error" role="alert" tabIndex={-1}>{error}</p>}
        <button type="submit" className="public-button public-button--primary public-form__submit" disabled={submitState === "submitting"}>
          {submitState === "submitting" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
          {submitState === "submitting" ? "접수 중" : "상담 신청 접수"}
        </button>
      </form>
      {showPrivacy && (
        <LegalDocumentModal type="privacy" company={company} onClose={() => setShowPrivacy(false)} />
      )}
    </section>
  );
}

export function PublicPaperRequestForm({ company = DEFAULT_FOOTER_INFO }: PublicFormProps) {
  const [form, setForm] = useState(initialPaperRequest);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<PaperErrorField>>({});
  const [showPrivacy, setShowPrivacy] = useState(false);
  const submitLockRef = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const fieldRefs = useRef<FieldRefs<PaperErrorField>>({});

  const setField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (error) setError("");
  };

  const focusFirstFieldError = (errors: FieldErrors<PaperErrorField>) => {
    const firstErrorField = getFirstErrorField(errors, paperErrorOrder);
    if (!firstErrorField) return;
    window.requestAnimationFrame(() => fieldRefs.current[firstErrorField]?.focus());
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitLockRef.current) return;
    const validationError = getPaperRequestValidationError(form);
    if (validationError) {
      const nextFieldErrors = getPaperFieldErrors(form);
      setFieldErrors(nextFieldErrors);
      setError(validationError);
      focusFirstFieldError(nextFieldErrors);
      return;
    }

    submitLockRef.current = true;
    setSubmitState("submitting");
    setFieldErrors({});
    setError("");
    try {
      await addDoc(
        collection(db, PUBLIC_REQUEST_COLLECTIONS.paperRequests),
        buildPaperRequest(form, new Date().toISOString()),
      );
      setSubmitState("success");
    } catch (submitError) {
      console.error("Paper request failed:", submitError);
      setError("배송 요청을 저장하지 못했습니다. 다시 시도하거나 031-487-4401로 문의해주세요.");
      setSubmitState("idle");
      submitLockRef.current = false;
      window.requestAnimationFrame(() => errorRef.current?.focus());
    }
  };

  if (submitState === "success") {
    return (
      <SuccessPanel
        title="용지 배송 요청이 접수되었습니다"
        message="담당자가 거래처와 배송 조건을 확인한 뒤 진행 내용을 안내합니다."
        onReset={() => {
          submitLockRef.current = false;
          setError("");
          setFieldErrors({});
          setForm(initialPaperRequest);
          setSubmitState("idle");
        }}
      />
    );
  }

  return (
    <section className="public-form-shell" aria-labelledby="paper-form-title">
      <aside className="public-form-aside public-form-aside--green">
        <PackageCheck aria-hidden="true" />
        <p className="public-kicker">가맹점 지원</p>
        <h2 id="paper-form-title">거래 가맹점 용지 배송 요청</h2>
        <p>가맹점 정보와 정확한 배송지를 남겨주시면 거래 여부와 규격을 확인해 처리합니다.</p>
        <ul>
          <li><Check aria-hidden="true" /> 거래처 확인 후 출고</li>
          <li><Check aria-hidden="true" /> 단말기 규격별 용지 확인</li>
          <li><Check aria-hidden="true" /> 접수함 저장 후 담당자 확인</li>
        </ul>
      </aside>

      <form
        className="public-form"
        onSubmit={submit}
        noValidate
        aria-busy={submitState === "submitting"}
        aria-describedby={error ? "public-paper-error" : undefined}
      >
        <div className="public-form__heading">
          <span>배송 정보</span>
          <p>주소와 연락처를 정확히 입력해주세요.</p>
        </div>
        <div className="public-form__grid">
          <label>
            <span>가맹점 상호 / 대표자 <b>*</b></span>
            <input
              ref={(node) => { fieldRefs.current.customerName = node; }}
              required
              maxLength={PUBLIC_REQUEST_LIMITS.customerName}
              value={form.customerName}
              aria-invalid={fieldErrors.customerName ? true : undefined}
              aria-describedby={describedBy(fieldErrors.customerName, "paper-customer-name-error")}
              onChange={(e) => setField("customerName", e.target.value)}
              placeholder="상호 또는 대표자명"
            />
            <FieldError id="paper-customer-name-error" message={fieldErrors.customerName} />
          </label>
          <label>
            <span>수령 연락처 <b>*</b></span>
            <input
              ref={(node) => { fieldRefs.current.contact = node; }}
              type="tel"
              required
              maxLength={PUBLIC_REQUEST_LIMITS.contact}
              value={form.contact}
              aria-invalid={fieldErrors.contact ? true : undefined}
              aria-describedby={describedBy(fieldErrors.contact, "paper-contact-error")}
              onChange={(e) => setField("contact", e.target.value)}
              placeholder="010-0000-0000"
              inputMode="tel"
              autoComplete="tel"
            />
            <FieldError id="paper-contact-error" message={fieldErrors.contact} />
          </label>
          <label className="public-form__wide">
            <span>배송지 주소 <b>*</b></span>
            <input
              ref={(node) => { fieldRefs.current.address = node; }}
              required
              maxLength={PUBLIC_REQUEST_LIMITS.address}
              value={form.address}
              aria-invalid={fieldErrors.address ? true : undefined}
              aria-describedby={describedBy(fieldErrors.address, "paper-address-error")}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="도로명 주소와 상세주소"
              autoComplete="street-address"
            />
            <FieldError id="paper-address-error" message={fieldErrors.address} />
          </label>
          <label>
            <span>단말기 모델</span>
            <input
              ref={(node) => { fieldRefs.current.deviceModel = node; }}
              maxLength={PUBLIC_REQUEST_LIMITS.deviceModel}
              value={form.deviceModel}
              aria-invalid={fieldErrors.deviceModel ? true : undefined}
              aria-describedby={describedBy(fieldErrors.deviceModel, "paper-device-model-error")}
              onChange={(e) => setField("deviceModel", e.target.value)}
              placeholder="모르면 비워두셔도 됩니다"
            />
            <FieldError id="paper-device-model-error" message={fieldErrors.deviceModel} />
          </label>
          <label>
            <span>요청 수량</span>
            <select
              ref={(node) => { fieldRefs.current.quantity = node; }}
              value={form.quantity}
              aria-invalid={fieldErrors.quantity ? true : undefined}
              aria-describedby={describedBy(fieldErrors.quantity, "paper-quantity-error")}
              onChange={(e) => setField("quantity", e.target.value)}
            >
              <option>1박스</option>
              <option>2박스</option>
              <option>3박스 이상</option>
            </select>
            <FieldError id="paper-quantity-error" message={fieldErrors.quantity} />
          </label>
        </div>
        <ConsentFields
          privacyConsent={form.privacyConsent}
          overseasTransferConsent={form.overseasTransferConsent}
          onChange={(field, value) => setField(field, value)}
          disabled={submitState === "submitting"}
          errors={fieldErrors}
          idPrefix="paper"
          privacyInputRef={(node) => { fieldRefs.current.privacyConsent = node; }}
          overseasInputRef={(node) => { fieldRefs.current.overseasTransferConsent = node; }}
          onOpenPrivacy={() => setShowPrivacy(true)}
        />
        {error && <p ref={errorRef} id="public-paper-error" className="public-form__error" role="alert" tabIndex={-1}>{error}</p>}
        <button type="submit" className="public-button public-button--primary public-form__submit" disabled={submitState === "submitting"}>
          {submitState === "submitting" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <PackageCheck aria-hidden="true" />}
          {submitState === "submitting" ? "접수 중" : "용지 배송 요청"}
        </button>
      </form>
      {showPrivacy && (
        <LegalDocumentModal type="privacy" company={company} onClose={() => setShowPrivacy(false)} />
      )}
    </section>
  );
}
