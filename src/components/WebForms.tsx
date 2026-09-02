import React, { useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import {
  buildConsultationRequest,
  buildPaperRequest,
  getConsultationValidationError,
  getPaperRequestValidationError,
  PUBLIC_REQUEST_COLLECTIONS,
  PUBLIC_REQUEST_LIMITS,
} from "../utils/publicRequests";
import { Phone, User, Landmark, HelpCircle, Check, Send, Sparkles } from "lucide-react";
import { PrivacyConsentField } from "./PrivacyConsentField";

export function ConsultationForm() {
  const [formData, setFormData] = useState({
    customerName: "",
    contact: "",
    businessName: "",
    businessType: "일반음식점",
    productOfInterest: "포스",
    message: "",
    privacyConsent: false,
    overseasTransferConsent: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const submitLockRef = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errorMessage) errorRef.current?.focus();
  }, [errorMessage]);

  useEffect(() => {
    if (success) successRef.current?.focus();
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current) return;

    const validationError = getConsultationValidationError(formData);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    submitLockRef.current = true;
    setErrorMessage("");
    setLoading(true);
    try {
      await addDoc(
        collection(db, PUBLIC_REQUEST_COLLECTIONS.consultations),
        buildConsultationRequest(formData, new Date().toISOString()),
      );
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMessage("신청서 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      submitLockRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div ref={successRef} role="status" aria-live="polite" tabIndex={-1} className="bg-slate-50 border border-slate-100 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md shadow-blue-600/20">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3">상담 신청 완료</h3>
        <p className="text-slate-500 leading-relaxed mb-6">
          탑정보통신에 문의해주셔서 감사합니다.<br />
          접수 내용을 확인한 후 담당자가 순차적으로 연락드리겠습니다.
        </p>
        <button
          onClick={() => {
            submitLockRef.current = false;
            setSuccess(false);
            setFormData({
              customerName: "",
              contact: "",
              businessName: "",
              businessType: "일반음식점",
              productOfInterest: "포스",
              message: "",
              privacyConsent: false,
              overseasTransferConsent: false,
            });
            setErrorMessage("");
          }}
          className="bg-slate-900 text-white font-medium px-6 py-3 rounded-2xl hover:bg-slate-800 transition"
        >
          새로운 문의 작성
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white border border-slate-100 p-8 md:p-10 rounded-3xl shadow-lg shadow-slate-100/50">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> 신규 매장 구성 상담
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">탑정보통신 매장 구성 상담</h2>
        <p className="text-slate-500 mt-2">카드 결제 단말기, 슬림 포스(POS), 세로형 키오스크까지 한번에 상담받으세요.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-busy={loading} aria-describedby={errorMessage ? "legacy-consultation-error" : undefined} className="space-y-6">
        {errorMessage && (
          <div ref={errorRef} id="legacy-consultation-error" role="alert" tabIndex={-1} className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="legacy-consultation-name" className="block text-xs font-semibold text-slate-600 mb-2">담당자 성함 *</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                id="legacy-consultation-name"
                required
                maxLength={PUBLIC_REQUEST_LIMITS.customerName}
                disabled={loading}
                placeholder="홍길동 대표님"
                value={formData.customerName}
                onChange={(e) => setFormValue("customerName", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
              />
            </div>
          </div>
          <div>
            <label htmlFor="legacy-consultation-contact" className="block text-xs font-semibold text-slate-600 mb-2">대표 연락처 *</label>
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                id="legacy-consultation-contact"
                required
                maxLength={PUBLIC_REQUEST_LIMITS.contact}
                disabled={loading}
                placeholder="010-1234-5678"
                value={formData.contact}
                onChange={(e) => setFormValue("contact", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="legacy-consultation-business" className="block text-xs font-semibold text-slate-600 mb-2">상호명 (업체명)</label>
            <div className="relative">
              <Landmark className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                id="legacy-consultation-business"
                maxLength={PUBLIC_REQUEST_LIMITS.businessName}
                disabled={loading}
                placeholder="탑에스프레소 신도림점"
                value={formData.businessName}
                onChange={(e) => setFormValue("businessName", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
              />
            </div>
          </div>
          <div>
            <label htmlFor="legacy-consultation-business-type" className="block text-xs font-semibold text-slate-600 mb-2">업종 카테고리</label>
            <select
              id="legacy-consultation-business-type"
              value={formData.businessType}
              onChange={(e) => setFormValue("businessType", e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
            >
              <option value="일반음식점">식당 / 카페 / 푸드코트</option>
              <option value="의류/잡화">의류점 / 플래그십 숍</option>
              <option value="뷰티/미용">미용실 / 네일숍 / 스파</option>
              <option value="체육/엔터">헬스장 / 스터디카페 / 노래방</option>
              <option value="기타">기타 오프라인 매장</option>
            </select>
          </div>
        </div>

        <fieldset disabled={loading} className="m-0 border-0 p-0">
          <legend className="block text-xs font-semibold text-slate-600 mb-2">관심 제품군</legend>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "포스", label: "프리미엄 POS" },
              { id: "단말기", label: "카드 단말기" },
              { id: "키오스크", label: "무인 키오스크" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={loading}
                onClick={() => setFormValue("productOfInterest", p.id)}
                className={`py-3.5 rounded-2xl border text-sm font-semibold transition-all duration-200 ${
                  formData.productOfInterest === p.id
                    ? "border-blue-600 bg-blue-50 text-blue-600 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="legacy-consultation-message" className="block text-xs font-semibold text-slate-600 mb-2">상담 문의내용</label>
          <div className="relative">
            <HelpCircle className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <textarea
              id="legacy-consultation-message"
              rows={3}
              maxLength={PUBLIC_REQUEST_LIMITS.message}
              disabled={loading}
              placeholder="필요한 장비와 설치 일정, 기존 기기 교체 여부를 알려주세요."
              value={formData.message}
              onChange={(e) => setFormValue("message", e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-4 py-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 resize-none"
            />
          </div>
        </div>

        <PrivacyConsentField
          privacyConsent={formData.privacyConsent}
          overseasTransferConsent={formData.overseasTransferConsent}
          onPrivacyConsentChange={(checked) => {
            setErrorMessage("");
            setFormData((prev) => ({ ...prev, privacyConsent: checked }));
          }}
          onOverseasTransferConsentChange={(checked) => {
            setErrorMessage("");
            setFormData((prev) => ({ ...prev, overseasTransferConsent: checked }));
          }}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 disabled:opacity-55 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          {loading ? "신청서 전달 중..." : "매장 구성 상담 신청하기"}
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  function setFormValue(key: string, val: string) {
    if (errorMessage) setErrorMessage("");
    setFormData((prev) => ({ ...prev, [key]: val }));
  }
}

export function PaperRollRequestForm() {
  const [formData, setFormData] = useState({
    customerName: "",
    contact: "",
    address: "",
    deviceModel: "",
    quantity: "1박스 (50롤)",
    privacyConsent: false,
    overseasTransferConsent: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const submitLockRef = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errorMessage) errorRef.current?.focus();
  }, [errorMessage]);

  useEffect(() => {
    if (success) successRef.current?.focus();
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current) return;

    const validationError = getPaperRequestValidationError(formData);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    submitLockRef.current = true;
    setErrorMessage("");
    setLoading(true);
    try {
      await addDoc(
        collection(db, PUBLIC_REQUEST_COLLECTIONS.paperRequests),
        buildPaperRequest(formData, new Date().toISOString()),
      );
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMessage("배송 요청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      submitLockRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div ref={successRef} role="status" aria-live="polite" tabIndex={-1} className="bg-slate-50 border border-slate-100 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md shadow-blue-600/20">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3">용지 배송 요청 접수 완료</h3>
        <p className="text-slate-500 leading-relaxed mb-6">
          가맹점 용지 배송 요청이 정상적으로 처리되었습니다.<br />
          담당자가 요청 내용을 확인한 후 배송을 진행합니다.<br />
          배송 관련 안내는 입력한 연락처로 전달됩니다.
        </p>
        <button
          onClick={() => {
            submitLockRef.current = false;
            setSuccess(false);
            setFormData({
              customerName: "",
              contact: "",
              address: "",
              deviceModel: "",
              quantity: "1박스 (50롤)",
              privacyConsent: false,
              overseasTransferConsent: false,
            });
            setErrorMessage("");
          }}
          className="bg-slate-900 text-white font-medium px-6 py-3 rounded-2xl hover:bg-slate-800 transition"
        >
          새로운 배송 요청
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white border border-slate-100 p-8 md:p-10 rounded-3xl shadow-lg shadow-slate-100/50">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold mb-3">
          ● 거래 가맹점 배송 지원
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">인쇄 영수증 용지 배송 요청</h2>
        <p className="text-slate-500 mt-2">대상 가맹점의 용지 배송 조건은 접수 내용을 확인한 뒤 안내합니다.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-busy={loading} aria-describedby={errorMessage ? "legacy-paper-error" : undefined} className="space-y-6">
        {errorMessage && (
          <div ref={errorRef} id="legacy-paper-error" role="alert" tabIndex={-1} className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        <div>
          <label htmlFor="legacy-paper-name" className="block text-xs font-semibold text-slate-600 mb-2">가맹점 상호 및 대표자 성함 *</label>
          <input
            type="text"
            id="legacy-paper-name"
            required
            maxLength={PUBLIC_REQUEST_LIMITS.customerName}
            disabled={loading}
            placeholder="예시: 탑 에스프레소 (김대표)"
            value={formData.customerName}
            onChange={(e) => setFormValue("customerName", e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
          />
        </div>

        <div>
          <label htmlFor="legacy-paper-contact" className="block text-xs font-semibold text-slate-600 mb-2">수령 연락처 *</label>
          <input
            type="tel"
            id="legacy-paper-contact"
            required
            maxLength={PUBLIC_REQUEST_LIMITS.contact}
            disabled={loading}
            placeholder="010-1234-5678"
            value={formData.contact}
            onChange={(e) => setFormValue("contact", e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
          />
        </div>

        <div>
          <label htmlFor="legacy-paper-address" className="block text-xs font-semibold text-slate-600 mb-2">배송지 주소 *</label>
          <input
            type="text"
            id="legacy-paper-address"
            required
            maxLength={PUBLIC_REQUEST_LIMITS.address}
            disabled={loading}
            placeholder="경기도 안산시 상록구 예시로 00, 2층"
            value={formData.address}
            onChange={(e) => setFormValue("address", e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="legacy-paper-device" className="block text-xs font-semibold text-slate-600 mb-2">단말기 모델명 (선택)</label>
            <input
              type="text"
              id="legacy-paper-device"
              maxLength={PUBLIC_REQUEST_LIMITS.deviceModel}
              disabled={loading}
              placeholder="K-30 또는 T-8000"
              value={formData.deviceModel}
              onChange={(e) => setFormValue("deviceModel", e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
            />
          </div>
          <div>
            <label htmlFor="legacy-paper-quantity" className="block text-xs font-semibold text-slate-600 mb-2">신청 수량</label>
            <select
              id="legacy-paper-quantity"
              value={formData.quantity}
              onChange={(e) => setFormValue("quantity", e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600"
            >
              <option value="1박스 (50롤)">1박스 (50롤)</option>
              <option value="2박스 (100롤)">2박스 (100롤)</option>
              <option value="3박스 (150롤)">3박스 (150롤) - 다소비가맹점</option>
            </select>
          </div>
        </div>

        <PrivacyConsentField
          privacyConsent={formData.privacyConsent}
          overseasTransferConsent={formData.overseasTransferConsent}
          onPrivacyConsentChange={(checked) => {
            setErrorMessage("");
            setFormData((prev) => ({ ...prev, privacyConsent: checked }));
          }}
          onOverseasTransferConsentChange={(checked) => {
            setErrorMessage("");
            setFormData((prev) => ({ ...prev, overseasTransferConsent: checked }));
          }}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 disabled:opacity-55 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          {loading ? "배송 요청 접수 중..." : "용지 배송 요청하기"}
          <Check className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  function setFormValue(key: string, val: string) {
    if (errorMessage) setErrorMessage("");
    setFormData((prev) => ({ ...prev, [key]: val }));
  }
}
