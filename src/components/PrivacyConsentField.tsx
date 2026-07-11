import React, { useCallback, useId, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { DEFAULT_FOOTER_INFO, FooterInfo, mergeFooterInfo } from "../utils/footerSettings";
import { LegalDocumentModal } from "./LegalDocumentModal";

interface PrivacyConsentFieldProps {
  privacyConsent: boolean;
  overseasTransferConsent: boolean;
  onPrivacyConsentChange: (checked: boolean) => void;
  onOverseasTransferConsentChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function PrivacyConsentField({
  privacyConsent,
  overseasTransferConsent,
  onPrivacyConsentChange,
  onOverseasTransferConsentChange,
  disabled = false,
}: PrivacyConsentFieldProps) {
  const privacyId = useId();
  const overseasId = useId();
  const [showPolicy, setShowPolicy] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<FooterInfo>(DEFAULT_FOOTER_INFO);
  const closePolicy = useCallback(() => setShowPolicy(false), []);

  const openPolicy = async () => {
    try {
      const footerSnapshot = await getDoc(doc(db, "settings", "footer"));
      if (footerSnapshot.exists()) {
        setCompanyInfo(mergeFooterInfo(footerSnapshot.data()));
      }
    } catch (error) {
      console.warn("Privacy policy company info load failed:", error);
    }
    setShowPolicy(true);
  };

  return (
    <div className="space-y-3 border-t border-slate-100 pt-5">
      <div className="flex items-start gap-3">
        <input
          id={privacyId}
          type="checkbox"
          required
          checked={privacyConsent}
          disabled={disabled}
          onChange={(event) => onPrivacyConsentChange(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor={privacyId} className="text-xs leading-5 text-slate-600">
          <span className="font-bold text-slate-800">[필수] 개인정보 수집·이용에 동의합니다.</span><br />
          입력한 신청·게시 정보는 요청 처리와 답변을 위해 저장되며, 업무 종료 또는 게시물 삭제 시 관리자가 삭제합니다.
        </label>
      </div>

      <div className="flex items-start gap-3">
        <input
          id={overseasId}
          type="checkbox"
          required
          checked={overseasTransferConsent}
          disabled={disabled}
          onChange={(event) => onOverseasTransferConsentChange(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor={overseasId} className="text-xs leading-5 text-slate-600">
          <span className="font-bold text-slate-800">[필수] Google Firebase를 통한 국외 처리에 동의합니다.</span><br />
          입력 정보는 서비스 제공 시 암호화된 네트워크를 통해 Google LLC의 미국 다중 리전(nam5) 인프라에 저장될 수 있습니다.
        </label>
      </div>

      <button
        type="button"
        onClick={openPolicy}
        className="text-xs font-bold text-blue-600 underline decoration-blue-200 underline-offset-4 hover:text-blue-700"
      >
        개인정보처리방침 전체 보기
      </button>

      {showPolicy && (
        <LegalDocumentModal type="privacy" company={companyInfo} onClose={closePolicy} />
      )}
    </div>
  );
}
