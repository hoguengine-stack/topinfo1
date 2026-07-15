import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  CloudUpload,
  Edit3,
  LogIn,
  LogOut,
  Menu,
  Phone,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { CMSPage, NavigationSettings } from "../types";
import { getNavigationLabel, getOrderedVisiblePages } from "../utils/cmsSettings";
import { BrandLogo } from "./public-v3/BrandLogo";

export interface WebsiteHeaderProps {
  isAdmin: boolean;
  isEmployee: boolean;
  isEditModeActive: boolean;
  setIsEditModeActive: (active: boolean) => void;
  setEditingBlock: (block: any) => void;
  setShowAddBlockMenuAtIndex: (value: any) => void;
  currentUrl: string;
  pages: CMSPage[];
  navigationSettings: NavigationSettings;
  setActiveEditTarget: (target: any) => void;
  handleLinkClick: (slug: string) => void;
  user: any;
  profile: any;
  logout: () => void;
  setIsSignUpMode: (mode: boolean) => void;
  setShowLoginModal: (show: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isCmsPublishing?: boolean;
  hasUnpublishedChanges?: boolean;
  onPublishWebsite?: () => void;
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
  navigationSettings,
  setActiveEditTarget,
  handleLinkClick,
  user,
  profile,
  logout,
  setIsSignUpMode,
  setShowLoginModal,
  mobileMenuOpen,
  setMobileMenuOpen,
  isCmsPublishing = false,
  hasUnpublishedChanges = false,
  onPublishWebsite,
}) => {
  const [accountOpen, setAccountOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const primaryPages = getOrderedVisiblePages(pages, navigationSettings, ["toss_pos", "products"]);
  const supportPages = getOrderedVisiblePages(pages, navigationSettings, ["board_resources", "board_suggestions", "request_paper"]);
  const supportIsActive = supportPages.some((page) => page.slug === currentUrl);
  const customPages = getOrderedVisiblePages(pages.filter((page) => page.isCustom), navigationSettings);
  const mobilePages = getOrderedVisiblePages(pages, navigationSettings, ["toss_pos", "products", "board_resources", "board_suggestions", "request_paper"]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const closeMenus = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileMenuOpen(false);
      setSupportOpen(false);
      setAccountOpen(false);
    };
    window.addEventListener("keydown", closeMenus);
    return () => window.removeEventListener("keydown", closeMenus);
  }, [setMobileMenuOpen]);

  const navigate = (page: CMSPage) => {
    setSupportOpen(false);
    if (isEditModeActive) {
      setActiveEditTarget({ type: "nav", pageId: page.id, page });
      return;
    }
    handleLinkClick(page.slug);
  };

  const openLogin = (signUp: boolean) => {
    setIsSignUpMode(signUp);
    setShowLoginModal(true);
  };

  const jumpToHomeSection = (sectionId: string) => {
    setSupportOpen(false);
    setMobileMenuOpen(false);
    const scrollToSection = () => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (currentUrl === "home") {
      scrollToSection();
      return;
    }
    handleLinkClick("home");
    window.setTimeout(scrollToSection, 220);
  };

  return (
    <>
      {isAdmin && (
        <div className="public-admin-strip">
          <div className="public-container">
            <span>{isEditModeActive ? "홈페이지 초안 편집 중" : "홈페이지 관리"}</span>
            <div>
              <button type="button" onClick={() => {
                setIsEditModeActive(!isEditModeActive);
                setEditingBlock(null);
                setShowAddBlockMenuAtIndex(null);
              }}><Edit3 /> {isEditModeActive ? "편집 종료" : "편집 시작"}</button>
              {isEditModeActive && <button type="button" className="is-publish" disabled={!hasUnpublishedChanges || isCmsPublishing} onClick={onPublishWebsite}><CloudUpload /> {isCmsPublishing ? "게시 중" : hasUnpublishedChanges ? "변경사항 게시" : "게시 완료"}</button>}
            </div>
          </div>
        </div>
      )}

      <header className="public-header">
        <div className="public-header__utility">
          <div className="public-container">
            <span>토스플레이스 직계약 대리점</span>
            <nav aria-label="빠른 지원 메뉴">
              <button type="button" onClick={() => handleLinkClick("request_paper")}><Truck /> 용지 배송</button>
              <a href="tel:0314874401"><Phone /> 대표·AS 031-487-4401</a>
            </nav>
          </div>
        </div>

        <div className="public-header__main public-container">
          <BrandLogo onClick={() => handleLinkClick("home")} />

          <nav className="public-header__nav" aria-label="주 메뉴">
            <button type="button" onClick={() => jumpToHomeSection("recommendations")}>업종별 추천</button>
            {primaryPages.map((page) => <button type="button" key={page.id} className={currentUrl === page.slug ? "is-active" : ""} aria-current={currentUrl === page.slug ? "page" : undefined} onClick={() => navigate(page)}>{getNavigationLabel(page, navigationSettings)}</button>)}
            <button type="button" onClick={() => jumpToHomeSection("promotion")}>프로모션</button>
            {supportPages.length > 0 && <div className={`public-header__support ${supportOpen ? "is-open" : ""} ${supportIsActive ? "is-current" : ""}`}>
              <button type="button" aria-haspopup="menu" aria-expanded={supportOpen} onClick={() => setSupportOpen((open) => !open)}>고객 지원 <ChevronDown /></button>
              <div role="menu">{supportPages.map((page) => <button type="button" role="menuitem" key={page.id} onClick={() => navigate(page)}>{getNavigationLabel(page, navigationSettings)}<span>{page.slug === "request_paper" ? "가맹점 소모품 요청" : page.slug === "board_resources" ? "설치·사용 자료 확인" : "불편·개선 의견 접수"}</span></button>)}</div>
            </div>}
            {customPages.map((page) => <button type="button" key={page.id} className={currentUrl === page.slug ? "is-active" : ""} onClick={() => navigate(page)}>{getNavigationLabel(page, navigationSettings)}</button>)}
          </nav>

          <div className="public-header__actions">
            <a className="public-header__phone" href="tel:0314874401"><Phone /><span><small>설치·AS</small><strong>031-487-4401</strong></span></a>
            {user ? (
              <div className="public-account">
                <button type="button" className="public-account__trigger" onClick={() => isEmployee ? handleLinkClick("admin") : setAccountOpen(!accountOpen)}><UserRound /><span>{profile?.nickname || user?.name || "내 계정"}</span></button>
                {accountOpen && !isEmployee && <div className="public-account__menu"><strong>{profile?.nickname || user?.name}</strong><small>{user?.email}</small><button type="button" onClick={() => { setAccountOpen(false); logout(); handleLinkClick("home"); }}><LogOut /> 로그아웃</button></div>}
                <button type="button" className="public-icon-button public-account__logout" onClick={() => { logout(); handleLinkClick("home"); }} aria-label="로그아웃" title="로그아웃"><LogOut /></button>
              </div>
            ) : (
              <button type="button" className="public-header__login" onClick={() => openLogin(false)}><LogIn /> 로그인</button>
            )}
            <button type="button" className="public-button public-button--primary public-header__cta" onClick={() => handleLinkClick("request_consult")}>무료 상담 <ArrowRight /></button>
          </div>

          <button type="button" className="public-header__menu-button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"} aria-expanded={mobileMenuOpen} aria-controls="public-mobile-menu">{mobileMenuOpen ? <X /> : <Menu />}</button>
        </div>
      </header>

      {mobileMenuOpen && (
        <aside className="public-mobile-menu" id="public-mobile-menu">
          <nav>
            <button type="button" onClick={() => jumpToHomeSection("recommendations")}>업종별 추천<ArrowRight /></button>
            {mobilePages.map((page) => <button type="button" key={page.id} className={currentUrl === page.slug ? "is-active" : ""} aria-current={currentUrl === page.slug ? "page" : undefined} onClick={() => { setMobileMenuOpen(false); navigate(page); }}>{getNavigationLabel(page, navigationSettings)}<ArrowRight /></button>)}
            <button type="button" onClick={() => jumpToHomeSection("promotion")}>프로모션<ArrowRight /></button>
          </nav>
          <div className="public-mobile-menu__contact"><a href="tel:0314874401"><Phone /> 031-487-4401</a><button type="button" onClick={() => { setMobileMenuOpen(false); handleLinkClick("request_consult"); }}>무료 상담 신청</button></div>
          {user ? <button type="button" className="public-mobile-menu__account" onClick={() => { setMobileMenuOpen(false); if (isEmployee) handleLinkClick("admin"); else { logout(); handleLinkClick("home"); } }}><UserRound /> {isEmployee ? "임직원 관리 화면" : "로그아웃"}</button> : <div className="public-mobile-menu__auth"><button type="button" onClick={() => { setMobileMenuOpen(false); openLogin(false); }}>로그인</button><button type="button" onClick={() => { setMobileMenuOpen(false); openLogin(true); }}>회원가입</button></div>}
        </aside>
      )}
    </>
  );
};
