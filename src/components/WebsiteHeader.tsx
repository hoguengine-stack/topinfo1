import React from "react";
import { 
  Edit3, Menu, X, UserCircle, LogOut, LogIn 
} from "lucide-react";
import { CMSPage } from "../types";

export interface WebsiteHeaderProps {
  isAdmin: boolean;
  isEmployee: boolean;
  isEditModeActive: boolean;
  setIsEditModeActive: (active: boolean) => void;
  setEditingBlock: (block: any) => void;
  setShowAddBlockMenuAtIndex: (val: any) => void;
  currentUrl: string;
  pages: CMSPage[];
  setActiveEditTarget: (target: any) => void;
  handleLinkClick: (slug: string) => void;
  user: any;
  profile: any;
  logout: () => void;
  setIsSignUpMode: (mode: boolean) => void;
  setShowLoginModal: (show: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const WebsiteHeader: React.FC<WebsiteHeaderProps> = ({
  isAdmin,
  isEmployee,
  isEditModeActive,
  setIsEditModeActive,
  setEditingBlock,
  setShowAddBlockMenuAtIndex,
  currentUrl,
  pages,
  setActiveEditTarget,
  handleLinkClick,
  user,
  profile,
  logout,
  setIsSignUpMode,
  setShowLoginModal,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
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
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo elements with Edit Mode Toggle */}
          <div className="flex items-center gap-4 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsEditModeActive(!isEditModeActive);
                  if (isEditModeActive) {
                    setEditingBlock(null);
                    setShowAddBlockMenuAtIndex(null);
                  }
                }}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold tracking-tight transition-all active:scale-95 flex items-center gap-1.5 border shadow-2xs shrink-0 ${
                  isEditModeActive
                    ? "bg-rose-500 hover:bg-rose-600 border-rose-500 text-white"
                    : "bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 shrink-0" />
                <span className="shrink-0">{isEditModeActive ? "편집 종료" : "편집 시작"}</span>
              </button>
            )}
            {renderLogo()}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-2 shrink-0">
            {["home", "products", "board_suggestions", "board_resources"].map((slug) => {
              const p = pages.find((item) => item.slug === slug);
              if (!p) return null;
              const isActive = currentUrl === p.slug;
              return (
                <button
                  key={p.id}
                  onClick={(e) => {
                    if (isEditModeActive) {
                      e.stopPropagation();
                      setActiveEditTarget({ type: "nav", pageId: p.slug, page: p });
                    } else {
                      handleLinkClick(p.slug);
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center shrink-0 ${
                    isEditModeActive ? "relative outline-blue-400 hover:outline hover:outline-dashed hover:outline-1" : ""
                  } ${
                    isActive ? "text-blue-600 bg-blue-50/60" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  title={isEditModeActive ? "클릭해서 탭 이름/설정 변경" : ""}
                >
                  {p.title}
                </button>
              );
            })}
            
            {pages.filter(p => p.isCustom).map(p => (
              <button
                key={p.id}
                onClick={(e) => {
                  if (isEditModeActive) {
                    e.stopPropagation();
                    setActiveEditTarget({ type: "nav", pageId: p.slug, page: p });
                  } else {
                    handleLinkClick(p.slug);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition shrink-0 ${
                  isEditModeActive ? "relative outline-blue-400 hover:outline hover:outline-dashed hover:outline-1" : ""
                } ${
                  currentUrl === p.slug ? "text-blue-600 bg-blue-50/60" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
                title={isEditModeActive ? "클릭해서 탭 이름/설정 변경" : ""}
              >
                {p.title}
              </button>
            ))}
          </nav>

          {/* Desktop Navigation md breakpoint fallback */}
          <nav className="hidden md:flex xl:hidden items-center gap-1 shrink-0">
            {["home", "products", "board_suggestions", "board_resources"].map((slug) => {
              const p = pages.find((item) => item.slug === slug);
              if (!p) return null;
              const isActive = currentUrl === p.slug;
              return (
                <button
                  key={p.id}
                  onClick={(e) => {
                    if (isEditModeActive) {
                      e.stopPropagation();
                      setActiveEditTarget({ type: "nav", pageId: p.slug, page: p });
                    } else {
                      handleLinkClick(p.slug);
                    }
                  }}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center shrink-0 ${
                    isEditModeActive ? "relative outline-blue-400 hover:outline hover:outline-dashed hover:outline-1" : ""
                  } ${
                    isActive ? "text-blue-600 bg-blue-50/60" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  title={isEditModeActive ? "클릭해서 탭 이름/설정 변경" : ""}
                >
                  {p.title}
                </button>
              );
            })}
          </nav>

          {/* Dual Action Gateways / Auth section */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {(() => {
              const p = pages.find(item => item.slug === "request_consult");
              if (!p) return null;
              return (
                <button
                  onClick={(e) => {
                    if (isEditModeActive) {
                      e.stopPropagation();
                      setActiveEditTarget({ type: "nav", pageId: p.slug, page: p });
                    } else {
                      handleLinkClick(p.slug);
                    }
                  }}
                  className={`bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-3 py-2.5 md:px-4.5 rounded-2xl transition shadow-md shadow-blue-600/10 flex items-center justify-center shrink-0 min-w-28 ${
                    isEditModeActive ? "relative outline-amber-400 outline-offset-2 hover:outline hover:outline-dashed hover:outline-2" : ""
                  }`}
                  title={isEditModeActive ? "클릭해서 탭 이름/설정 변경" : ""}
                >
                  {p.title}
                </button>
              );
            })()}

            {(() => {
              const p = pages.find(item => item.slug === "request_paper");
              if (!p) return null;
              return (
                <button
                  onClick={(e) => {
                    if (isEditModeActive) {
                      e.stopPropagation();
                      setActiveEditTarget({ type: "nav", pageId: p.slug, page: p });
                    } else {
                      handleLinkClick(p.slug);
                    }
                  }}
                  className={`bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2.5 md:px-4 rounded-2xl transition flex items-center justify-center shrink-0 min-w-24 ${
                    isEditModeActive ? "relative outline-amber-400 outline-offset-2 hover:outline hover:outline-dashed hover:outline-2" : ""
                  }`}
                  title={isEditModeActive ? "클릭해서 탭 이름/설정 변경" : ""}
                >
                  {p.title}
                </button>
              );
            })()}
            
            <div className="w-px h-5 bg-slate-200 mx-1.5" />

            {user ? (
              <div className="flex items-center gap-2 shrink-0">
                <div 
                  className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-blue-600 transition" 
                  onClick={() => {
                    if (isEmployee) {
                      handleLinkClick("admin");
                    } else {
                      alert("프로필: " + profile?.nickname + " (" + profile?.jobTitle + ")");
                    }
                  }}
                  title={isEmployee ? "관리자 포털 정보" : "내 정보"}
                >
                  <UserCircle className="w-5 h-5 text-slate-500" />
                  <span className="text-xs font-extrabold shrink-0">{profile?.nickname || "대표주님"}</span>
                  {isEmployee && <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0">임직원</span>}
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition shrink-0"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setIsSignUpMode(false); setShowLoginModal(true); }}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0"
              >
                <LogIn className="w-4 h-4" /> 로그인
              </button>
            )}
          </div>

          {/* Hamburger menu for mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-6 py-6 space-y-4">
          <div className="flex flex-col gap-2">
            {["home", "products", "board_suggestions", "board_resources", "request_consult", "request_paper"].map((slug) => {
              const p = pages.find(item => item.slug === slug);
              if (!p) return null;
              return (
                <button
                  key={slug}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLinkClick(slug);
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition animate-in fade-in duration-100"
                >
                  {p.title}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
            {user ? (
              <div className="flex items-center justify-between px-4">
                <span className="text-xs font-bold text-slate-700">{profile?.nickname} 대표님</span>
                <button onClick={() => { setMobileMenuOpen(false); logout(); }} className="text-red-500 font-bold text-xs">로그아웃</button>
              </div>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); setIsSignUpMode(false); setShowLoginModal(true); }}
                className="w-full text-center bg-slate-100 text-slate-800 font-bold py-3 rounded-xl text-xs"
              >
                로그인 및 가입
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
