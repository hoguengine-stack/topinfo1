import React from "react";
import { doc, setDoc } from "firebase/firestore";
import { Settings } from "lucide-react";
import { useToast } from "../contexts/ToastContext";

export interface WebsiteFooterProps {
  isEditModeActive: boolean;
  footerInfo: {
    companyName: string;
    ceo: string;
    address: string;
    phone: string;
    email: string;
    copyright: string;
  };
  setFooterInfo: (info: any) => void;
  isEmployee: boolean;
  db: any;
  setCurrentUrl: (url: string) => void;
  handleLinkClick: (slug: string) => void;
}

export const WebsiteFooter: React.FC<WebsiteFooterProps> = ({
  isEditModeActive,
  footerInfo,
  setFooterInfo,
  isEmployee,
  db,
  setCurrentUrl,
  handleLinkClick,
}) => {
  const { showToast } = useToast();

  const saveFooterInfo = async () => {
    try {
      await setDoc(doc(db, "settings", "footer"), footerInfo);
    } catch (err) {
      console.error("Footer settings save failed:", err);
      showToast("하단 회사 정보 저장에 실패했습니다.", "error");
    }
  };

  const renderLogo = () => (
    <div
      className="flex items-center gap-3 cursor-pointer select-none"
      onClick={() => handleLinkClick("home")}
    >
      <div className="w-10 h-10 rounded-full border-[3px] border-[#0f62fe] bg-white flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm">
        <span className="font-serif font-black text-2xl text-[#0f62fe] leading-none mb-0.5">T</span>
        <div className="absolute inset-0 border-2 border-transparent hover:border-blue-500/10 rounded-full" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-black text-slate-900 tracking-tight leading-none font-sans">탑 정보통신</span>
        <span className="text-[8px] text-[#0f62fe] font-bold tracking-widest leading-none mt-1 uppercase">Top Info & Comm</span>
      </div>
    </div>
  );

  return (
    <footer className="bg-white border-t border-slate-100 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-2 items-center md:items-start text-center md:text-left">
          {renderLogo()}
          {isEditModeActive ? (
            <div className="bg-slate-50 border border-dashed border-blue-200 rounded-2xl p-4 space-y-2 mt-4 w-full max-w-lg text-slate-700 text-xs font-semibold text-left">
              <div className="text-blue-600 font-bold mb-2">하단 사업자정보 편집기:</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400">회사명</label>
                  <input
                    type="text"
                    value={footerInfo.companyName}
                    onChange={(e) => {
                      const updated = { ...footerInfo, companyName: e.target.value };
                      setFooterInfo(updated);
                    }}
                    onBlur={saveFooterInfo}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-505/20 focus:border-blue-505 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400">대표이사</label>
                  <input
                    type="text"
                    value={footerInfo.ceo}
                    onChange={(e) => {
                      const updated = { ...footerInfo, ceo: e.target.value };
                      setFooterInfo(updated);
                    }}
                    onBlur={saveFooterInfo}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-505/20 focus:border-blue-505 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] text-slate-400">주소지</label>
                  <input
                    type="text"
                    value={footerInfo.address}
                    onChange={(e) => {
                      const updated = { ...footerInfo, address: e.target.value };
                      setFooterInfo(updated);
                    }}
                    onBlur={saveFooterInfo}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-505/20 focus:border-blue-505 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400">장애대표번호</label>
                  <input
                    type="text"
                    value={footerInfo.phone}
                    onChange={(e) => {
                      const updated = { ...footerInfo, phone: e.target.value };
                      setFooterInfo(updated);
                    }}
                    onBlur={saveFooterInfo}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-505/20 focus:border-blue-505 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-400">이메일</label>
                  <input
                    type="text"
                    value={footerInfo.email}
                    onChange={(e) => {
                      const updated = { ...footerInfo, email: e.target.value };
                      setFooterInfo(updated);
                    }}
                    onBlur={saveFooterInfo}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-505/20 focus:border-blue-505 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] text-slate-400">카피라이트 저작권문구</label>
                  <input
                    type="text"
                    value={footerInfo.copyright}
                    onChange={(e) => {
                      const updated = { ...footerInfo, copyright: e.target.value };
                      setFooterInfo(updated);
                    }}
                    onBlur={saveFooterInfo}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-505/20 focus:border-blue-505 outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed text-left">
              {footerInfo.companyName} | 대표이사: {footerInfo.ceo} | 주소: {footerInfo.address} <br />
              고객보급지원 전산망 대표번호: {footerInfo.phone} | 이메일: {footerInfo.email}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
          <button onClick={() => showToast("이용약관: 본 서비스의 이용에 관한 세부 조항 및 약관입니다. 상세 문의는 고객지원실로 부탁드립니다.", "info")} className="hover:text-slate-600">이용약관</button>
          <button onClick={() => showToast("개인정보처리방침: 탑정보통신은 관련 법령에 따라 이용자의 개인정보를 소중히 보호하고 관리합니다.", "info")} className="hover:text-slate-600">개인정보처리방침</button>
          {isEmployee && (
            <button onClick={() => setCurrentUrl("admin")} className="font-bold text-blue-600 flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" /> 임직원 제어포털
            </button>
          )}
        </div>
      </div>
      <div className="max-w-6xl mx-auto text-center border-t border-slate-50 mt-8 pt-8 text-[11px] font-medium text-slate-350">
        {footerInfo.copyright}
      </div>
    </footer>
  );
};
