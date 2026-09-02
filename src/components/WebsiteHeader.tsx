import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Box,
  ChevronDown,
  Coffee,
  CreditCard,
  Edit3,
  FileText,
  Headphones,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Monitor,
  Phone,
  ReceiptText,
  RefreshCcw,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserRound,
  UtensilsCrossed,
  Wifi,
  Wine,
  Wrench,
  X,
  CloudUpload,
  type LucideIcon,
} from "lucide-react";
import { CMSPage, NavigationSettings } from "../types";
import { getNavigationLabel, getOrderedVisiblePages } from "../utils/cmsSettings";
import { getPublicTargetHref } from "../utils/publicRoutes";
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

type MegaMenuKey = "solutions" | "industries" | "replacement" | "support";

interface NavigationDestination {
  label: string;
  description: string;
  target: string;
  icon: LucideIcon;
  page?: CMSPage;
}

interface NavigationGroup {
  label: string;
  items: NavigationDestination[];
}

interface MegaMenuDefinition {
  label: string;
  eyebrow: string;
  description: string;
  groups: NavigationGroup[];
  alignment?: "start" | "center" | "end";
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const getFocusableElements = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true",
  );

const usesBrowserShortcut = (event: React.MouseEvent<HTMLAnchorElement>) =>
  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

const hasDestination = (item: NavigationDestination | null): item is NavigationDestination => Boolean(item);

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
  const [desktopMenu, setDesktopMenu] = useState<MegaMenuKey | null>(null);
  const [mobileSection, setMobileSection] = useState<MegaMenuKey | null>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const desktopTriggerRefs = useRef<Partial<Record<MegaMenuKey, HTMLButtonElement | null>>>({});
  const accountContainerRef = useRef<HTMLDivElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);

  const closeMobileMenuAndRestoreFocus = useCallback(() => {
    setMobileMenuOpen(false);
    window.setTimeout(() => {
      mobileMenuButtonRef.current?.focus({ preventScroll: true });
    }, 50);
  }, [setMobileMenuOpen]);

  const visiblePages = getOrderedVisiblePages(pages, navigationSettings);
  const pageBySlug = new Map(visiblePages.map((page) => [page.slug, page]));
  const customPages = visiblePages.filter((page) => page.isCustom);
  const tossPage = pageBySlug.get("toss_pos");
  const productsPage = pageBySlug.get("products");
  const industriesPage = pageBySlug.get("industries");
  const promotionPage = pageBySlug.get("promotion_pos");
  const usedPosPage = pageBySlug.get("used_pos");
  const supportPage = pageBySlug.get("support");
  const aiPhonePage = pageBySlug.get("uplus_ai_phone");
  const consultationPage = pageBySlug.get("request_consult");
  const paperPage = pageBySlug.get("request_paper");
  const resourcesPage = pageBySlug.get("board_resources");
  const suggestionsPage = pageBySlug.get("board_suggestions");

  const destinationForPage = (
    page: CMSPage | undefined,
    label: string,
    description: string,
    icon: LucideIcon,
  ): NavigationDestination | null => page ? ({ label, description, icon, target: page.slug, page }) : null;

  const industryTarget = (sector: string) => tossPage ? `toss_pos?sector=${sector}` : "#recommendations";
  const industryPage = tossPage || undefined;

  const menuDefinitions: Record<MegaMenuKey, MegaMenuDefinition> = {
    solutions: {
      label: "솔루션",
      eyebrow: "매장 운영 흐름",
      description: "장비 이름보다 매장에서 필요한 역할부터 확인하세요.",
      alignment: "start",
      groups: [
        {
          label: "주문·결제",
          items: [
            destinationForPage(productsPage, "POS·결제·주변기기", "포스와 결제 장비, 출력 장비를 비교합니다.", Monitor),
            destinationForPage(tossPage, "토스POS 구성", "토스POS 제품과 업종별 운영 구성을 확인합니다.", CreditCard),
          ].filter(hasDestination),
        },
        {
          label: "매장 연결·관리",
          items: [
            aiPhonePage
              ? destinationForPage(aiPhonePage, "U+ AI전화", "전화 응대 기능과 설치 전 확인 항목을 살펴봅니다.", Phone)
              : null,
            { label: "인터넷·CCTV·매장 통신", description: "매장 장비를 연결하는 통신·보안 구성을 확인합니다.", icon: Wifi, target: "#services" },
            { label: "설치·사용 안내", description: "상담부터 설치와 사용 안내까지의 흐름을 확인합니다.", icon: Wrench, target: "#installation" },
          ].filter(hasDestination),
        },
        ...(customPages.length > 0 ? [{
          label: "추가 안내",
          items: customPages.map((page) => ({
            label: getNavigationLabel(page, navigationSettings),
            description: "탑정보통신에서 제공하는 추가 안내 페이지입니다.",
            icon: FileText,
            target: page.slug,
            page,
          })),
        }] : []),
      ],
    },
    industries: {
      label: "업종별 설계",
      eyebrow: "업종별 운영 방식",
      description: "주문과 결제 동선이 다른 업종별로 필요한 구성을 확인하세요.",
      alignment: "center",
      groups: [
        {
          label: "매장 유형",
          items: [
            destinationForPage(industriesPage, "업종별 설계 전체 보기", "업종별 주문·결제·출력·관리 흐름을 한곳에서 비교합니다.", Box),
            { label: "카페·베이커리", description: "메뉴 옵션, 주문 출력, 고객 관리를 연결합니다.", icon: Coffee, target: industryTarget("cafe"), page: industryPage },
            { label: "음식점", description: "주문 접수부터 주방 출력과 결제를 연결합니다.", icon: UtensilsCrossed, target: industryTarget("restaurant"), page: industryPage },
            { label: "술집·바", description: "테이블 주문과 추가 주문, 결제 흐름을 확인합니다.", icon: Wine, target: industryTarget("bar"), page: industryPage },
            { label: "도·소매업", description: "상품 등록, 바코드, 재고와 매출 관리를 확인합니다.", icon: ShoppingBag, target: industryTarget("retail"), page: industryPage },
            { label: "뷰티·서비스", description: "예약, 일정, 고객 메모와 결제를 연결합니다.", icon: Scissors, target: industryTarget("beauty"), page: industryPage },
          ].filter(hasDestination),
        },
      ],
    },
    replacement: {
      label: "중고·교체",
      eyebrow: "기존 장비 점검",
      description: "현재 장비와 필요한 교체 범위를 확인한 뒤 구성과 재고를 안내합니다.",
      alignment: "center",
      groups: [
        {
          label: "교체 전 확인",
          items: [
            destinationForPage(usedPosPage, "중고 POS·교체 기준", "모델·상태·포함 품목·재고와 지원 범위를 확인합니다.", RefreshCcw),
            destinationForPage(productsPage, "필요한 장비 비교", "POS와 결제·출력 장비의 역할을 먼저 비교합니다.", Box),
            consultationPage ? {
              label: "기존 POS 교체 상담",
              description: "현재 장비와 매장 환경을 남기면 교체 범위를 함께 확인합니다.",
              icon: Wrench,
              target: "request_consult?intent=replace",
              page: consultationPage,
            } : null,
            consultationPage ? {
              label: "중고 POS 확인 항목",
              description: "모델·등급·포함 품목·재고는 상담 시 확인합니다.",
              icon: Box,
              target: "request_consult?intent=used",
              page: consultationPage,
            } : null,
          ].filter(hasDestination),
        },
      ],
    },
    support: {
      label: "고객지원",
      eyebrow: "설치 이후 지원",
      description: "기존 고객의 자료, 용지, 개선 요청과 AS 연락처를 모았습니다.",
      alignment: "end",
      groups: [
        {
          label: "온라인 지원",
          items: [
            destinationForPage(supportPage, "고객지원 전체 보기", "설치·AS와 목적별 온라인 지원 창구를 확인합니다.", Headphones),
            destinationForPage(resourcesPage, "자료실", "설치와 사용에 필요한 안내 자료를 확인합니다.", FileText),
            destinationForPage(paperPage, "용지 배송 요청", "배송지와 단말기 정보를 입력해 요청합니다.", ReceiptText),
            destinationForPage(suggestionsPage, "건의·개선 요청", "운영 중 불편한 점과 개선 의견을 남깁니다.", MessageSquare),
          ].filter(hasDestination),
        },
        {
          label: "전화 지원",
          items: [
            { label: "설치·AS 031-487-4401", description: "설치와 운영 중 문의를 전화로 접수합니다.", icon: Headphones, target: "tel:0314874401" },
          ],
        },
      ],
    },
  };

  const searchParams = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const selectedSector = currentUrl === "toss_pos" ? searchParams.get("sector") : null;
  const consultationIntent = currentUrl === "request_consult" ? searchParams.get("intent") : null;
  const supportIsActive = ["support", "board_resources", "board_suggestions", "request_paper"].includes(currentUrl);
  const solutionIsActive = currentUrl === "products" || currentUrl === "uplus_ai_phone" || customPages.some((page) => page.slug === currentUrl);
  const replacementIsActive = currentUrl === "used_pos" || consultationIntent === "replace" || consultationIntent === "used";

  useEffect(() => {
    if (!desktopMenu) return;

    const getOpenMenuRoot = () => desktopNavRef.current?.querySelector<HTMLElement>(`[data-menu-key="${desktopMenu}"]`);
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!getOpenMenuRoot()?.contains(event.target as Node)) setDesktopMenu(null);
    };
    const closeOnFocusOutside = (event: FocusEvent) => {
      if (!getOpenMenuRoot()?.contains(event.target as Node)) setDesktopMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const key = desktopMenu;
      setDesktopMenu(null);
      window.requestAnimationFrame(() => desktopTriggerRefs.current[key]?.focus());
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("focusin", closeOnFocusOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("focusin", closeOnFocusOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [desktopMenu]);

  useEffect(() => {
    if (!accountOpen || mobileMenuOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!accountContainerRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setAccountOpen(false);
      window.requestAnimationFrame(() => accountTriggerRef.current?.focus());
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountOpen, mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const dialog = mobileMenuRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setDesktopMenu(null);
    setAccountOpen(false);

    const siblingStates = Array.from(dialog.parentElement?.children || [])
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== dialog)
      .map((element) => ({ element, inert: element.inert }));
    siblingStates.forEach(({ element }) => { element.inert = true; });

    const focusInitialControl = window.requestAnimationFrame(() => {
      const initialControl = dialog.querySelector<HTMLElement>("[data-mobile-menu-initial-focus]");
      (initialControl || getFocusableElements(dialog)[0] || dialog).focus();
    });

    const keepFocusInsideDialog = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobileMenuAndRestoreFocus();
        return;
      }
      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!dialog.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      } else if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", keepFocusInsideDialog);
    return () => {
      window.cancelAnimationFrame(focusInitialControl);
      document.removeEventListener("keydown", keepFocusInsideDialog);
      document.body.style.overflow = previousOverflow;
      siblingStates.forEach(({ element, inert }) => { element.inert = inert; });
      setMobileSection(null);
    };
  }, [closeMobileMenuAndRestoreFocus, mobileMenuOpen]);

  const jumpToHomeSection = (sectionId: string) => {
    const normalizedSectionId = sectionId.split(":")[0];
    const scrollToSection = () => document.getElementById(normalizedSectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (currentUrl === "home") {
      scrollToSection();
      return;
    }
    handleLinkClick("home");
    window.setTimeout(scrollToSection, 220);
  };

  const activateDestination = (destination: NavigationDestination) => {
    setDesktopMenu(null);
    setMobileMenuOpen(false);

    if (isEditModeActive && destination.page) {
      setActiveEditTarget({ type: "nav", pageId: destination.page.id, page: destination.page });
      return;
    }
    if (destination.target.startsWith("#")) {
      jumpToHomeSection(destination.target.slice(1));
      return;
    }
    handleLinkClick(destination.target);
  };

  const handleDestinationClick = (event: React.MouseEvent<HTMLAnchorElement>, destination: NavigationDestination) => {
    if (usesBrowserShortcut(event)) return;
    event.preventDefault();
    activateDestination(destination);
  };

  const handleDesktopTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, key: MegaMenuKey) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setDesktopMenu(key);
      window.requestAnimationFrame(() => {
        document.getElementById(`public-mega-${key}`)?.querySelector<HTMLElement>("a[href]")?.focus();
      });
    } else if (event.key === "Escape" && desktopMenu === key) {
      event.preventDefault();
      setDesktopMenu(null);
    }
  };

  const handleMegaMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>("a[href]"));
    if (links.length === 0) return;

    const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement);
    let nextIndex = currentIndex;
    if (event.key === "ArrowDown") nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % links.length;
    if (event.key === "ArrowUp") nextIndex = currentIndex < 0 ? links.length - 1 : (currentIndex - 1 + links.length) % links.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = links.length - 1;
    event.preventDefault();
    links[nextIndex]?.focus();
  };

  const openLogin = (signUp: boolean) => {
    setIsSignUpMode(signUp);
    setShowLoginModal(true);
  };

  const isDestinationCurrent = (destination: NavigationDestination) => {
    if (/^(https?:\/\/|tel:|mailto:|#)/i.test(destination.target)) return false;
    const [targetPage, rawQuery = ""] = destination.target.split("?", 2);
    if (targetPage !== currentUrl) return false;

    const targetParams = new URLSearchParams(rawQuery);
    if (targetParams.size === 0) {
      if (targetPage === "toss_pos" && selectedSector) return false;
      if (targetPage === "request_consult" && consultationIntent) return false;
      return true;
    }
    return Array.from(targetParams.entries()).every(([key, value]) => searchParams.get(key) === value);
  };

  const renderDestination = (destination: NavigationDestination, mobile = false) => {
    const Icon = destination.icon;
    const isCurrentPage = isDestinationCurrent(destination);
    return (
      <a
        key={`${destination.target}-${destination.label}`}
        className={mobile ? "public-mobile-destination" : "public-mega-menu__link"}
        href={getPublicTargetHref(destination.target)}
        aria-current={isCurrentPage ? "page" : undefined}
        onClick={(event) => handleDestinationClick(event, destination)}
      >
        <span className="public-navigation-icon" aria-hidden="true"><Icon /></span>
        <span><strong>{destination.label}</strong><small>{destination.description}</small></span>
        <ArrowRight aria-hidden="true" />
      </a>
    );
  };

  const renderMegaMenu = (key: MegaMenuKey) => {
    const menu = menuDefinitions[key];
    return (
      <div
        id={`public-mega-${key}`}
        className={`public-mega-menu public-mega-menu--${menu.alignment || "center"}`}
        hidden={desktopMenu !== key}
        onKeyDown={handleMegaMenuKeyDown}
      >
        <header className="public-mega-menu__intro">
          <span>{menu.eyebrow}</span>
          <strong>{menu.label}</strong>
          <p>{menu.description}</p>
        </header>
        <div className="public-mega-menu__groups">
          {menu.groups.map((group, groupIndex) => (
            <section key={`${key}-${group.label}`} aria-labelledby={`public-mega-${key}-group-${groupIndex}`}>
              <h2 id={`public-mega-${key}-group-${groupIndex}`}>{group.label}</h2>
              <div>{group.items.map((destination) => renderDestination(destination))}</div>
            </section>
          ))}
        </div>
      </div>
    );
  };

  const renderDesktopMenuTrigger = (key: MegaMenuKey, isActive: boolean) => {
    const menu = menuDefinitions[key];
    return (
      <div className="public-header__nav-item" data-menu-key={key} onPointerEnter={() => setDesktopMenu(key)}>
        <button
          ref={(node) => { desktopTriggerRefs.current[key] = node; }}
          type="button"
          className={isActive ? "is-active" : ""}
          aria-expanded={desktopMenu === key}
          aria-controls={`public-mega-${key}`}
          onClick={() => setDesktopMenu((open) => open === key ? null : key)}
          onKeyDown={(event) => handleDesktopTriggerKeyDown(event, key)}
        >
          {menu.label}<ChevronDown aria-hidden="true" />
        </button>
        {renderMegaMenu(key)}
      </div>
    );
  };

  const renderMobileAccordion = (key: MegaMenuKey, isActive: boolean) => {
    const menu = menuDefinitions[key];
    const open = mobileSection === key;
    return (
      <section className={`public-mobile-accordion ${isActive ? "is-current" : ""}`}>
        <h2>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`public-mobile-${key}`}
            onClick={() => setMobileSection((section) => section === key ? null : key)}
          >
            <span>{menu.label}</span><ChevronDown aria-hidden="true" />
          </button>
        </h2>
        <div id={`public-mobile-${key}`} hidden={!open}>
          <p>{menu.description}</p>
          {menu.groups.map((group) => (
            <section key={`mobile-${key}-${group.label}`}>
              <h3>{group.label}</h3>
              <div>{group.items.map((destination) => renderDestination(destination, true))}</div>
            </section>
          ))}
        </div>
      </section>
    );
  };

  const tossDestination = tossPage ? {
    label: "토스POS",
    description: "토스POS 제품과 탑정보통신의 구성·설치 안내를 확인합니다.",
    target: tossPage.slug,
    icon: CreditCard,
    page: tossPage,
  } satisfies NavigationDestination : null;
  const promotionDestination: NavigationDestination = {
    label: "프로모션",
    description: "현재 적용 가능한 조건과 확인 항목을 상담 전에 살펴봅니다.",
    target: promotionPage?.slug || "#promotion",
    icon: ShieldCheck,
    page: promotionPage,
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
            <span>POS · 결제 · 매장 통신 설치 상담</span>
            <nav aria-label="빠른 지원 메뉴">
              {paperPage && <a href={getPublicTargetHref(paperPage.slug)} onClick={(event) => handleDestinationClick(event, { label: "용지 배송", description: "", icon: Truck, target: paperPage.slug, page: paperPage })}><Truck /> 용지 배송</a>}
              <a href="tel:0314874401"><Phone /> 대표·AS 031-487-4401</a>
            </nav>
          </div>
        </div>

        <div className="public-header__main public-container">
          <BrandLogo onClick={() => handleLinkClick("home")} />

          <nav ref={desktopNavRef} className="public-header__nav" aria-label="주 메뉴">
            {renderDesktopMenuTrigger("solutions", solutionIsActive)}
            {tossDestination && <a className={`public-header__direct-link public-header__direct-link--toss ${currentUrl === "toss_pos" && !selectedSector ? "is-active" : ""}`} href={getPublicTargetHref(tossDestination.target)} aria-current={currentUrl === "toss_pos" && !selectedSector ? "page" : undefined} onClick={(event) => handleDestinationClick(event, tossDestination)}>토스POS</a>}
            {renderDesktopMenuTrigger("industries", currentUrl === "industries" || Boolean(selectedSector))}
            {renderDesktopMenuTrigger("replacement", replacementIsActive)}
            <a className={`public-header__direct-link ${currentUrl === "promotion_pos" ? "is-active" : ""}`} href={getPublicTargetHref(promotionDestination.target)} aria-current={currentUrl === "promotion_pos" ? "page" : undefined} onClick={(event) => handleDestinationClick(event, promotionDestination)}>프로모션</a>
            {renderDesktopMenuTrigger("support", supportIsActive)}
          </nav>

          <div className="public-header__actions">
            <a className="public-header__remote-support" href="https://wonremote-a7fd3.web.app/download/agent"><Monitor /><span>원격지원 설치</span></a>
            <a className="public-header__phone" href="tel:0314874401"><Phone /><span><small>설치·AS</small><strong>031-487-4401</strong></span></a>
            {user ? (
              <div ref={accountContainerRef} className="public-account">
                <button
                  ref={accountTriggerRef}
                  type="button"
                  className="public-account__trigger"
                  aria-expanded={!isEmployee ? accountOpen : undefined}
                  aria-controls={!isEmployee ? "public-account-menu" : undefined}
                  onClick={() => isEmployee ? handleLinkClick("admin") : setAccountOpen((open) => !open)}
                ><UserRound /><span>{profile?.nickname || user?.name || "내 계정"}</span></button>
                {accountOpen && !isEmployee && <div id="public-account-menu" className="public-account__menu"><strong>{profile?.nickname || user?.name}</strong><small>{user?.email}</small><button type="button" onClick={() => { setAccountOpen(false); logout(); handleLinkClick("home"); }}><LogOut /> 로그아웃</button></div>}
                <button type="button" className="public-icon-button public-account__logout" onClick={() => { logout(); handleLinkClick("home"); }} aria-label="로그아웃" title="로그아웃"><LogOut /></button>
              </div>
            ) : (
              <button type="button" className="public-header__login" onClick={() => openLogin(false)}><LogIn /> 로그인</button>
            )}
            {consultationPage && <a className="public-header__consult" href={getPublicTargetHref(consultationPage.slug)} aria-current={currentUrl === "request_consult" && !replacementIsActive ? "page" : undefined} onClick={(event) => handleDestinationClick(event, { label: "상담하기", description: "", icon: ArrowRight, target: consultationPage.slug, page: consultationPage })}>상담하기 <ArrowRight aria-hidden="true" /></a>}
          </div>

          <button
            ref={mobileMenuButtonRef}
            type="button"
            className="public-header__menu-button"
            onClick={() => mobileMenuOpen ? closeMobileMenuAndRestoreFocus() : setMobileMenuOpen(true)}
            onKeyDown={(event) => {
              if (event.key !== "Escape" || !mobileMenuOpen) return;
              event.preventDefault();
              closeMobileMenuAndRestoreFocus();
            }}
            aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={mobileMenuOpen}
            aria-controls="public-mobile-menu"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <aside
        ref={mobileMenuRef}
        className="public-mobile-menu"
        id="public-mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-mobile-menu-title"
        tabIndex={-1}
        hidden={!mobileMenuOpen}
      >
          <header className="public-mobile-menu__header">
            <div><span>TOPINFO</span><strong id="public-mobile-menu-title">전체 메뉴</strong></div>
            <button type="button" className="public-mobile-menu__close" data-mobile-menu-initial-focus onClick={closeMobileMenuAndRestoreFocus} aria-label="메뉴 닫기"><X /></button>
          </header>
          <div className="public-mobile-menu__body">
            <nav aria-label="모바일 주 메뉴">
              {renderMobileAccordion("solutions", solutionIsActive)}
              {tossDestination && <a className={`public-mobile-menu__direct public-mobile-menu__direct--toss ${currentUrl === "toss_pos" && !selectedSector ? "is-active" : ""}`} href={getPublicTargetHref(tossDestination.target)} aria-current={currentUrl === "toss_pos" && !selectedSector ? "page" : undefined} onClick={(event) => handleDestinationClick(event, tossDestination)}><span>토스POS</span><ArrowRight aria-hidden="true" /></a>}
              {renderMobileAccordion("industries", currentUrl === "industries" || Boolean(selectedSector))}
              {renderMobileAccordion("replacement", replacementIsActive)}
              <a className={`public-mobile-menu__direct ${currentUrl === "promotion_pos" ? "is-active" : ""}`} href={getPublicTargetHref(promotionDestination.target)} aria-current={currentUrl === "promotion_pos" ? "page" : undefined} onClick={(event) => handleDestinationClick(event, promotionDestination)}><span>프로모션</span><ArrowRight aria-hidden="true" /></a>
              {renderMobileAccordion("support", supportIsActive)}
            </nav>

            <div className="public-mobile-menu__contact">
              <a className="public-mobile-menu__remote-support" href="https://wonremote-a7fd3.web.app/download/agent"><Monitor /> 원격지원 설치</a>
              <a href="tel:0314874401"><Phone /> 031-487-4401</a>
              {consultationPage && <a className="is-primary" href={getPublicTargetHref(consultationPage.slug)} onClick={(event) => handleDestinationClick(event, { label: "상담 신청", description: "", icon: ArrowRight, target: consultationPage.slug, page: consultationPage })}>상담 신청 <ArrowRight aria-hidden="true" /></a>}
            </div>

            {user ? <button type="button" className="public-mobile-menu__account" onClick={() => { setMobileMenuOpen(false); if (isEmployee) handleLinkClick("admin"); else { logout(); handleLinkClick("home"); } }}><UserRound /> {isEmployee ? "임직원 관리 화면" : "로그아웃"}</button> : <div className="public-mobile-menu__auth"><button type="button" onClick={() => { setMobileMenuOpen(false); openLogin(false); }}>로그인</button><button type="button" onClick={() => { setMobileMenuOpen(false); openLogin(true); }}>회원가입</button></div>}
          </div>
      </aside>
    </>
  );
};
