import React, { useCallback, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { ArrowRight, Mail, MapPin, Phone, Save, Settings } from "lucide-react";
import { CMSPage, NavigationSettings } from "../types";
import { FooterInfo } from "../utils/footerSettings";
import { getNavigationLabel, getOrderedVisiblePages } from "../utils/cmsSettings";
import { LegalDocumentModal, LegalDocumentType } from "./LegalDocumentModal";
import { BrandLogo } from "./public-v3/BrandLogo";

export interface WebsiteFooterProps {
  isEditModeActive: boolean;
  footerInfo: FooterInfo;
  setFooterInfo: (info: FooterInfo) => void;
  isEmployee: boolean;
  db: any;
  setCurrentUrl: (url: string) => void;
  handleLinkClick: (slug: string) => void;
  pages: CMSPage[];
  navigationSettings: NavigationSettings;
}

export const WebsiteFooter: React.FC<WebsiteFooterProps> = ({
  isEditModeActive,
  footerInfo,
  setFooterInfo,
  isEmployee,
  db,
  setCurrentUrl,
  handleLinkClick,
  pages,
  navigationSettings,
}) => {
  const [legalDocument, setLegalDocument] = useState<LegalDocumentType | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const servicePages = getOrderedVisiblePages(pages, navigationSettings, ["toss_pos", "products", "board_resources"]);
  const supportPages = getOrderedVisiblePages(pages, navigationSettings, ["board_suggestions", "request_paper"]);
  const closeLegalDocument = useCallback(() => setLegalDocument(null), []);

  const update = (field: keyof FooterInfo, value: string) => {
    setSaved(false);
    setFooterInfo({ ...footerInfo, [field]: value });
  };

  const save = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "footer"), footerInfo);
      setSaved(true);
    } catch (error) {
      console.error("Footer settings save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <footer className="public-footer">
      <div className="public-container public-footer__top">
        <div className="public-footer__brand">
          <BrandLogo inverse onClick={() => handleLinkClick("home")} />
          <p>{footerInfo.tagline}</p>
          <div><a href={`tel:${footerInfo.phone.replace(/[^\d+]/g, "")}`}><Phone />{footerInfo.phone}</a><a href={`mailto:${footerInfo.email}`}><Mail />{footerInfo.email}</a></div>
        </div>
        <nav className="public-footer__nav" aria-label="하단 메뉴">
          <div><strong>서비스</strong>{servicePages.map((page) => <button type="button" key={page.id} onClick={() => handleLinkClick(page.slug)}>{getNavigationLabel(page, navigationSettings)}</button>)}</div>
          <div><strong>고객지원</strong>{supportPages.map((page) => <button type="button" key={page.id} onClick={() => handleLinkClick(page.slug)}>{getNavigationLabel(page, navigationSettings)}</button>)}<button type="button" onClick={() => handleLinkClick("request_consult")}>무료 상담</button></div>
          <div><strong>정책</strong><button type="button" onClick={() => setLegalDocument("terms")}>이용약관</button><button type="button" onClick={() => setLegalDocument("privacy")}>개인정보처리방침</button>{isEmployee && <button type="button" onClick={() => setCurrentUrl("admin")}><Settings /> 임직원 제어포털</button>}</div>
        </nav>
      </div>

      <div className="public-container public-footer__company">
        <p><MapPin /> {footerInfo.address}</p>
        <p>{footerInfo.companyName} · 대표 {footerInfo.ceo} · 사업자등록번호 {footerInfo.businessRegistrationNumber}</p>
        <p>개인정보 담당 {footerInfo.privacyOfficer} · {footerInfo.privacyContact || footerInfo.email}</p>
      </div>

      {isEditModeActive && (
        <section className="public-container public-footer-editor" aria-label="회사 정보 편집">
          <header><div><strong>하단 회사 정보</strong><span>로고는 변경할 수 없습니다.</span></div><button type="button" className="public-button public-button--primary" onClick={save} disabled={saving}><Save /> {saving ? "저장 중" : saved ? "저장됨" : "정보 저장"}</button></header>
          <div className="public-footer-editor__grid">
            <label><span>회사명</span><input value={footerInfo.companyName} onChange={(e) => update("companyName", e.target.value)} /></label>
            <label><span>대표자</span><input value={footerInfo.ceo} onChange={(e) => update("ceo", e.target.value)} /></label>
            <label className="is-wide"><span>푸터 소개 문구</span><input value={footerInfo.tagline} onChange={(e) => update("tagline", e.target.value)} /></label>
            <label className="is-wide"><span>주소</span><input value={footerInfo.address} onChange={(e) => update("address", e.target.value)} /></label>
            <label><span>대표·AS 전화</span><input value={footerInfo.phone} onChange={(e) => update("phone", e.target.value)} /></label>
            <label><span>이메일</span><input value={footerInfo.email} onChange={(e) => update("email", e.target.value)} /></label>
            <label><span>사업자등록번호</span><input value={footerInfo.businessRegistrationNumber} onChange={(e) => update("businessRegistrationNumber", e.target.value)} /></label>
            <label><span>개인정보 담당</span><input value={footerInfo.privacyOfficer} onChange={(e) => update("privacyOfficer", e.target.value)} /></label>
            <label><span>개인정보 담당 연락처</span><input value={footerInfo.privacyContact} onChange={(e) => update("privacyContact", e.target.value)} /></label>
            <label className="is-wide"><span>저작권 문구</span><input value={footerInfo.copyright} onChange={(e) => update("copyright", e.target.value)} /></label>
          </div>
        </section>
      )}

      <div className="public-container public-footer__bottom"><span>{footerInfo.copyright}</span><button type="button" onClick={() => handleLinkClick("request_consult")}>상담 신청 <ArrowRight /></button></div>
      {legalDocument && <LegalDocumentModal type={legalDocument} company={footerInfo} onClose={closeLegalDocument} />}
    </footer>
  );
};
