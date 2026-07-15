import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { Check, ChevronRight, LoaderCircle, PackageCheck, Send } from "lucide-react";
import { db } from "../../firebase";
import {
  buildConsultationRequest,
  buildPaperRequest,
  getConsultationValidationError,
  getPaperRequestValidationError,
} from "../../utils/publicRequests";

type SubmitState = "idle" | "submitting" | "success";

const initialConsultation = {
  customerName: "",
  contact: "",
  businessName: "",
  businessType: "",
  productOfInterest: "인터넷 + 토스포스 패키지",
  message: "",
  privacyConsent: false,
  overseasTransferConsent: false,
};

const initialPaperRequest = {
  customerName: "",
  contact: "",
  address: "",
  deviceModel: "",
  quantity: "1박스",
  privacyConsent: false,
  overseasTransferConsent: false,
};

function ConsentFields({
  privacyConsent,
  overseasTransferConsent,
  onChange,
}: {
  privacyConsent: boolean;
  overseasTransferConsent: boolean;
  onChange: (field: "privacyConsent" | "overseasTransferConsent", value: boolean) => void;
}) {
  return (
    <div className="public-form__consents">
      <label>
        <input
          type="checkbox"
          checked={privacyConsent}
          onChange={(event) => onChange("privacyConsent", event.target.checked)}
        />
        <span><strong>[필수]</strong> 상담 및 요청 처리를 위한 개인정보 수집·이용에 동의합니다.</span>
      </label>
      <label>
        <input
          type="checkbox"
          checked={overseasTransferConsent}
          onChange={(event) => onChange("overseasTransferConsent", event.target.checked)}
        />
        <span><strong>[필수]</strong> Firebase를 통한 개인정보 국외 처리 안내에 동의합니다.</span>
      </label>
    </div>
  );
}

function SuccessPanel({ title, message, onReset }: { title: string; message: string; onReset: () => void }) {
  return (
    <div className="public-form__success" role="status">
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

export function PublicConsultationForm() {
  const [form, setForm] = useState(initialConsultation);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  const setField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = getConsultationValidationError(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitState("submitting");
    setError("");
    try {
      await addDoc(collection(db, "consultations"), buildConsultationRequest(form, new Date().toISOString()));
      setSubmitState("success");
    } catch (submitError) {
      console.error("Consultation request failed:", submitError);
      setError("접수 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 031-487-4401로 연락해주세요.");
      setSubmitState("idle");
    }
  };

  if (submitState === "success") {
    return (
      <SuccessPanel
        title="상담 요청이 접수되었습니다"
        message="남겨주신 연락처로 매장 환경과 설치 일정을 확인해 안내드리겠습니다."
        onReset={() => { setForm(initialConsultation); setSubmitState("idle"); }}
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
          <li><span>01</span><div><strong>요청 접수</strong><small>작성 즉시 작업관리 화면에 연결</small></div></li>
          <li><span>02</span><div><strong>조건 확인</strong><small>인터넷·장비·카드가맹 구성 확인</small></div></li>
          <li><span>03</span><div><strong>설치 일정 안내</strong><small>담당자가 연락해 다음 단계 확정</small></div></li>
        </ol>
        <a href="tel:0314874401" className="public-form-aside__contact">전화 상담 <strong>031-487-4401</strong></a>
      </aside>

      <form className="public-form" onSubmit={submit} noValidate>
        <div className="public-form__heading">
          <span>무료 상담 신청</span>
          <p>필수 항목만 입력해도 접수할 수 있습니다.</p>
        </div>
        <div className="public-form__grid">
          <label>
            <span>담당자 성함 <b>*</b></span>
            <input value={form.customerName} onChange={(e) => setField("customerName", e.target.value)} placeholder="홍길동" autoComplete="name" />
          </label>
          <label>
            <span>대표 연락처 <b>*</b></span>
            <input value={form.contact} onChange={(e) => setField("contact", e.target.value)} placeholder="010-0000-0000" inputMode="tel" autoComplete="tel" />
          </label>
          <label>
            <span>매장명</span>
            <input value={form.businessName} onChange={(e) => setField("businessName", e.target.value)} placeholder="예: 탑카페 안산점" />
          </label>
          <label>
            <span>업종</span>
            <select value={form.businessType} onChange={(e) => setField("businessType", e.target.value)}>
              <option value="">선택해주세요</option>
              <option>카페·베이커리</option>
              <option>음식점·주점</option>
              <option>소매·편의점</option>
              <option>뷰티·서비스</option>
              <option>기타</option>
            </select>
          </label>
          <label className="public-form__wide">
            <span>관심 구성</span>
            <select value={form.productOfInterest} onChange={(e) => setField("productOfInterest", e.target.value)}>
              <option>인터넷 + 토스포스 패키지</option>
              <option>토스포스·토스프론트</option>
              <option>카드단말기·키오스크</option>
              <option>LG U+ 인터넷 개통</option>
              <option>U+ AI전화</option>
              <option>U+ 지능형 CCTV</option>
              <option>U+ 인터넷전화</option>
              <option>기존 매장 장비 교체</option>
            </select>
          </label>
          <label className="public-form__wide">
            <span>문의 내용</span>
            <textarea value={form.message} onChange={(e) => setField("message", e.target.value)} placeholder="매장 위치, 오픈 예정일, 현재 사용 중인 장비 등을 알려주시면 더 정확히 안내할 수 있습니다." rows={5} />
          </label>
        </div>
        <ConsentFields
          privacyConsent={form.privacyConsent}
          overseasTransferConsent={form.overseasTransferConsent}
          onChange={(field, value) => setField(field, value)}
        />
        {error && <p className="public-form__error" role="alert">{error}</p>}
        <button type="submit" className="public-button public-button--primary public-form__submit" disabled={submitState === "submitting"}>
          {submitState === "submitting" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
          {submitState === "submitting" ? "접수 중" : "무료 상담 접수"}
        </button>
      </form>
    </section>
  );
}

export function PublicPaperRequestForm() {
  const [form, setForm] = useState(initialPaperRequest);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  const setField = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = getPaperRequestValidationError(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitState("submitting");
    setError("");
    try {
      await addDoc(collection(db, "paper_requests"), buildPaperRequest(form, new Date().toISOString()));
      setSubmitState("success");
    } catch (submitError) {
      console.error("Paper request failed:", submitError);
      setError("배송 요청을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
      setSubmitState("idle");
    }
  };

  if (submitState === "success") {
    return (
      <SuccessPanel
        title="용지 배송 요청이 접수되었습니다"
        message="담당자가 거래처와 배송 정보를 확인한 뒤 작업관리 화면에서 처리합니다."
        onReset={() => { setForm(initialPaperRequest); setSubmitState("idle"); }}
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
          <li><Check aria-hidden="true" /> 접수 내역 작업관리 연동</li>
        </ul>
      </aside>

      <form className="public-form" onSubmit={submit} noValidate>
        <div className="public-form__heading">
          <span>배송 정보</span>
          <p>주소와 연락처를 정확히 입력해주세요.</p>
        </div>
        <div className="public-form__grid">
          <label>
            <span>가맹점 상호 / 대표자 <b>*</b></span>
            <input value={form.customerName} onChange={(e) => setField("customerName", e.target.value)} placeholder="상호 또는 대표자명" />
          </label>
          <label>
            <span>수령 연락처 <b>*</b></span>
            <input value={form.contact} onChange={(e) => setField("contact", e.target.value)} placeholder="010-0000-0000" inputMode="tel" autoComplete="tel" />
          </label>
          <label className="public-form__wide">
            <span>배송지 주소 <b>*</b></span>
            <input value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="도로명 주소와 상세주소" autoComplete="street-address" />
          </label>
          <label>
            <span>단말기 모델</span>
            <input value={form.deviceModel} onChange={(e) => setField("deviceModel", e.target.value)} placeholder="모르면 비워두셔도 됩니다" />
          </label>
          <label>
            <span>요청 수량</span>
            <select value={form.quantity} onChange={(e) => setField("quantity", e.target.value)}>
              <option>1박스</option>
              <option>2박스</option>
              <option>3박스 이상</option>
            </select>
          </label>
        </div>
        <ConsentFields
          privacyConsent={form.privacyConsent}
          overseasTransferConsent={form.overseasTransferConsent}
          onChange={(field, value) => setField(field, value)}
        />
        {error && <p className="public-form__error" role="alert">{error}</p>}
        <button type="submit" className="public-button public-button--primary public-form__submit" disabled={submitState === "submitting"}>
          {submitState === "submitting" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <PackageCheck aria-hidden="true" />}
          {submitState === "submitting" ? "접수 중" : "용지 배송 요청"}
        </button>
      </form>
    </section>
  );
}
