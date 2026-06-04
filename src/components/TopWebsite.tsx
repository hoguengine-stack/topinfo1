import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, setDoc, updateDoc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { CMSPage, Product, CMSBlock } from "../types";
import { TopWebsiteView } from "./TopWebsiteView";
import { Trash2, Sparkles } from "lucide-react";

interface TopWebsiteProps {
  onEnterInternalDashboard: () => void;
}

export function TopWebsite({ onEnterInternalDashboard }: TopWebsiteProps) {
  const { user, profile, logout, emailLogin, emailSignUp, login, setIsAccessCodeVerified, isAdmin, isEmployee } = useAuth();
  
  // Navigation states
  const [currentUrl, setCurrentUrl] = useState<string>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Easter Egg tracking states
  const [googleClickTimes, setGoogleClickTimes] = useState<number[]>([]);
  const [showGoogleLogin, setShowGoogleLogin] = useState(false);

  // Real-time inline CMS editor states
  const [isEditModeActive, setIsEditModeActive] = useState(false);
  const [showAddBlockMenuAtIndex, setShowAddBlockMenuAtIndex] = useState<{ pageId: string; index: number } | null>(null);

  // HUD Element editor state
  const [activeEditTarget, setActiveEditTarget] = useState<{
    type: "hero" | "features" | "features_card" | "card" | "text" | "banner" | "image" | "product" | "features_settings" | "nav";
    pageId: string;
    page: CMSPage;
    blockId?: string;
    block?: CMSBlock;
    itemIndex?: number;
    productId?: string;
    product?: Product;
  } | null>(null);

  // Db states
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Local active product tab
  const [productFilter, setProductFilter] = useState<string>("전체");

  // Email form state
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [authFormData, setAuthFormData] = useState({
    email: "",
    password: "",
    nickname: "",
    jobTitle: "현장 관리자",
    accessCode: "",
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [footerInfo, setFooterInfo] = useState({
    companyName: "(주)탑정보통신",
    ceo: "탑정보통신전담",
    address: "서울특별시 구로구 신도림동",
    phone: "24시간 장애접수 1544-0000",
    email: "support@topinfo.com",
    copyright: "Copyright © 2026 TOP Information & Communication. All Rights Reserved."
  });

  const [customConfirm, setCustomConfirm] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [customAlert, setCustomAlert] = useState<{
    show: boolean;
    title: string;
    message: string;
  } | null>(null);

  // Check and initialize default pages/products if Firestore is blank
  useEffect(() => {
    // CMS Pages snapshot listener
    const unsubPages = onSnapshot(collection(db, "cms_pages"), async (snap) => {
      const items: CMSPage[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() } as CMSPage));
      
      // Automate restoration of any missing standard pages to ensure of all menus are present
      const defaultPages: CMSPage[] = [
        {
          id: "home",
          title: "홈",
          slug: "home",
          isCustom: false,
          createdAt: new Date().toISOString(),
          blocks: [
            {
              id: "b1",
              type: "hero",
              title: "결제의 새로운 표준,\n탑정보통신이 주도합니다",
              badge: "탑정보통신 2026 비즈니스 패밀리쉽",
              subtitle: "대표님의 성공적인 오프라인 비즈니스를 지원하는 스마트 슬림 포스기, 고속 애플페이 단말기 무상 지원 솔루션.",
              align: "center",
              buttonText: "무상 가맹 상담 신청",
              buttonLink: "request_consult"
            },
            {
              id: "b2",
              type: "features",
              title: "탑정보통신만이 드릴 수 있는 압도적인 기술 혜택",
              subtitle: "기다림 없는 빠른 신용 결제 승인 속도와 롤 전산용지 평생 무상 제공 혜택을 직접 확인해 보세요.",
              items: [
                { title: "0.5초 초고속 카드 승인", desc: "고객 대기 시간을 혁신적으로 낮춘 하드웨어 탑재", icon: "zap" },
                { title: "평생 보증 수리 약정", desc: "영업 정지가 일어나지 않도록 상시 무상 부상 수리", icon: "clock" },
                { title: "인쇄용지 무제한 무상 배송", desc: "탑정보통신 단말 제휴 시, 용지를 완전 무료 배송", icon: "card" },
                { title: "전용 실시간 정산 서비스", desc: "매장 매출 확인과 세무 국세청 대조 작업을 한 화면에", icon: "chart" }
              ]
            },
            {
              id: "b3",
              type: "banner",
              title: "매장 용지가 똑 떨어지셨나요?\n대기 없이 10초 만에 무료 배송을 신청하세요.",
              subtitle: "탑정보통신 패밀리 가맹점이라면 전 기종 인쇄 용지를 100% 무상으로 오늘 발송해 드립니다.",
              buttonText: "용지 무료 배송 요청하기",
              buttonLink: "request_paper"
            }
          ]
        },
        {
          id: "products",
          title: "제품군소개",
          slug: "products",
          isCustom: false,
          createdAt: new Date().toISOString(),
          blocks: [
            {
              id: "p1",
              type: "hero",
              title: "탑정보통신 프리미엄 결제 하드웨어",
              badge: "최우수 기술 장비 공급 라인업",
              subtitle: "신규 매장에 가장 잘 어울리는 화이트 슬림 디자인과 다채로운 결제 연동 리스트입니다.",
              align: "center",
              buttonText: "기기 무상 임대 상담",
              buttonLink: "request_consult"
            }
          ]
        },
        {
          id: "board_suggestions",
          title: "건의제안",
          slug: "board_suggestions",
          isCustom: false,
          createdAt: new Date().toISOString(),
          blocks: [
            {
              id: "s1",
              type: "hero",
              title: "고객 가맹점 소통 건의제판",
              badge: "실시간 열린 마음 피드백",
              subtitle: "탑정보통신은 대표님들의 사소한 소리도 귀 기울여 듣고 현장에 반영하도록 최선을 다합니다.",
              align: "center"
            }
          ]
        },
        {
          id: "board_resources",
          title: "자료실자료",
          slug: "board_resources",
          isCustom: false,
          createdAt: new Date().toISOString(),
          blocks: [
            {
              id: "r1",
              type: "hero",
              title: "기술 및 매뉴얼 통합 자료실",
              badge: "자가 장애 조치 및 사용성 다운로드",
              subtitle: "용지 교체부터 애플페이 오류 처리, 정산 전산 대조 가이드 매뉴얼을 무료 다운로드하세요.",
              align: "center"
            }
          ]
        },
        {
          id: "request_consult",
          title: "가맹상담",
          slug: "request_consult",
          isCustom: false,
          createdAt: new Date().toISOString(),
          blocks: [
            {
              id: "c1",
              type: "hero",
              title: "탑정보통신 무료 가맹 상담",
              badge: "가장 빠른 24시간 가입 지원",
              subtitle: "카드 결제 단말기, 슬림 포스(POS), 세로형 키오스크까지 한번에 연동 상담받으세요.",
              align: "center"
            }
          ]
        },
        {
          id: "request_paper",
          title: "영수증 용지신청",
          slug: "request_paper",
          isCustom: false,
          createdAt: new Date().toISOString(),
          blocks: [
            {
              id: "pa1",
              type: "hero",
              title: "무상 롤 전산 용지 특별배송",
              badge: "초고속 로젠택배 특별 지원",
              subtitle: "탑정보통신 단말 거래처 패밀리라면 평생 전액 영수증 인쇄 롤 용지를 전 기종 무상 지원해 드립니다.",
              align: "center"
            }
          ]
        }
      ];

      let hasMissing = false;
      const existingIds = items.map(p => p.id);
      
      for (const dp of defaultPages) {
        if (!existingIds.includes(dp.id)) {
          hasMissing = true;
          console.log(`[CMS Init] Missing standard page '${dp.id}', auto-populating...`);
          await setDoc(doc(db, "cms_pages", dp.id), dp);
        }
      }

      if (!hasMissing) {
        setPages(items);
      }
    });

    // Products snapshot listener
    const unsubProducts = onSnapshot(collection(db, "products"), async (snap) => {
      const items: Product[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() } as Product));
      
      const initDocRef = doc(db, "settings", "initialization_state");
      try {
        const initSnap = await getDoc(initDocRef);
        
        if (items.length === 0 && !initSnap.exists()) {
          console.log("Empty products collection and uninitialized database. Initializing defaults...");
          const defaultProducts: Product[] = [
            {
              id: "pos-t8",
              name: "Premium Touch POS T-8000",
              category: "포스",
              description: "심플하고 모던한 감성의 극슬림 프리미엄 15.6인치 태블릿 정전식 포스기",
              features: ["무소음 팬리스 초고속 연동", "가입비 및 설치비 전액 면제", "고해상도 터치 듀얼 모니터 완비"],
              specs: { "운영체제": "Smart POS OS (Android 13)", "결제범위": "IC, MS, QR, 삼성/애플페이", "크기": "350 x 210 x 300 mm" },
              imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80",
              createdAt: new Date().toISOString()
            },
            {
              id: "term-k3",
              name: "High Speed Terminal K-3000",
              category: "단말기",
              description: "애플페이 전격 지원, 수동식 영수증 자동절단 복합 탑재 유선 통합 단말기",
              features: ["초고속 영수증 열전사 인쇄", "애플페이 전면 호환 및 사인패드 내장", "영업 마감 자동 매출 대조 지원"],
              specs: { "통신연결": "네트워크 LAN 케이블 / 전화선 국선", "기능": "삼성페이, 카드, 현금영수증" },
              imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=400&q=80",
              createdAt: new Date().toISOString()
            },
            {
              id: "kiosk-s5",
              name: "Contactless Self Kiosk S-500",
              category: "키오스크",
              description: "테이블 오더 및 대여 요양 무인 선결제용 21인치 세로형 멀티 터치 키오스크",
              features: ["직관적 UI로 누구나 간편 주문", "스탠드/벽걸이 모드 전면 커스텀 조립", "식음료 전용 결제 앱 기본 내장"],
              specs: { "디스플레이": "21.5인치 세로형 FHD IPS", "용지크기": "80mm 대용량 롤 지원" },
              imageUrl: "https://images.unsplash.com/photo-1574634534894-89d7576c8259?auto=format&fit=crop&w=400&q=80",
              createdAt: new Date().toISOString()
            }
          ];

          for (const pr of defaultProducts) {
            await setDoc(doc(db, "products", pr.id), pr);
          }
          await setDoc(initDocRef, { initialized: true });
        } else {
          setProducts(items);
          if (!initSnap.exists() && items.length > 0) {
            await setDoc(initDocRef, { initialized: true });
          }
        }
      } catch (err) {
        console.error("Initialization state check failed: ", err);
        setProducts(items);
      }
    });

    // Navigation settings listener
    const unsub_nav = onSnapshot(doc(db, "settings", "navigation"), (snap) => {
      if (!snap.exists()) {
        setDoc(doc(db, "settings", "navigation"), {
          home: { label: "홈", visible: true },
          products: { label: "제품군소개", visible: true },
          board_suggestions: { label: "건의제안", visible: true },
          board_resources: { label: "자료실자료", visible: true },
          request_consult: { label: "무상 가맹/상담신청", visible: true },
          request_paper: { label: "용지 배송요청", visible: true }
        });
      }
    });

    // Footer info settings listener
    const unsub_footer = onSnapshot(doc(db, "settings", "footer"), (snap) => {
      if (snap.exists()) {
        setFooterInfo(snap.data() as any);
      } else {
        setDoc(doc(db, "settings", "footer"), {
          companyName: "(주)탑정보통신",
          ceo: "탑정보통신전담",
          address: "서울특별시 구로구 신도림동",
          phone: "24시간 장애접수 1544-0000",
          email: "support@topinfo.com",
          copyright: "Copyright © 2026 TOP Information & Communication. All Rights Reserved."
        });
      }
    });

    return () => {
      unsubPages();
      unsubProducts();
      unsub_nav();
      unsub_footer();
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (isSignUpMode) {
        if (!authFormData.nickname || !authFormData.email || !authFormData.password) {
          setAuthError("모든 필수 항목을 기입해 주세요.");
          setAuthLoading(false);
          return;
        }

        await emailSignUp(
          authFormData.email,
          authFormData.password,
          authFormData.nickname,
          authFormData.jobTitle
        );

        if (authFormData.accessCode === "kicckmk") {
          setIsAccessCodeVerified(true);
          localStorage.setItem("isAccessCodeVerified", "true");
        }
      } else {
        await emailLogin(authFormData.email, authFormData.password);
      }
      setShowLoginModal(false);
      setAuthFormData({ email: "", password: "", nickname: "", jobTitle: "현장 관리자", accessCode: "" });
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential") {
        setAuthError("이메일 주소 또는 비밀번호가 잘못 입력되었습니다.");
      } else if (err.code === "auth/email-already-in-use") {
        setAuthError("이미 사용 중인 이메일 주소입니다.");
      } else {
        setAuthError(err.message || "인증 처리 오류가 발생했습니다.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      setAuthError("");
      await login();
      setShowLoginModal(false);
      onEnterInternalDashboard();
    } catch (err: any) {
      console.error(err);
      setAuthError("Google Workspace 연동인증에 실패했습니다.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleMoveBlockUp = async (page: CMSPage, index: number) => {
    if (index === 0) return;
    const updatedBlocks = [...page.blocks];
    const temp = updatedBlocks[index];
    updatedBlocks[index] = updatedBlocks[index - 1];
    updatedBlocks[index - 1] = temp;
    try {
      await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
    } catch (e) {
      console.error("Block move up fails: ", e);
    }
  };

  const handleMoveBlockDown = async (page: CMSPage, index: number) => {
    if (index === page.blocks.length - 1) return;
    const updatedBlocks = [...page.blocks];
    const temp = updatedBlocks[index];
    updatedBlocks[index] = updatedBlocks[index + 1];
    updatedBlocks[index + 1] = temp;
    try {
      await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
    } catch (e) {
      console.error("Block move down fails: ", e);
    }
  };

  const handleDeleteBlock = async (page: CMSPage, index: number) => {
    if (page.blocks.length <= 1) {
      setCustomAlert({
        show: true,
        title: "삭제 비활성화",
        message: "홈페이지 화면에는 최소 1개 이상의 블록이 있어야 합니다."
      });
      return;
    }

    setCustomConfirm({
      show: true,
      title: "블록 파기 확인",
      message: "이 블록 데이터를 정말로 파기하시겠습니까? (영구 삭제 및 실시간 자동 반영됨)",
      onConfirm: async () => {
        const updatedBlocks = page.blocks.filter((_, idx) => idx !== index);
        try {
          await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
        } catch (e) {
          console.error("Block remove fails: ", e);
        }
      }
    });
  };

  const handleInsertBlock = async (page: CMSPage, index: number, type: "hero" | "features" | "text" | "banner" | "image" | "divider") => {
    const newBlockId = "block-" + Math.random().toString(36).substring(2, 9);
    let newBlock: any;
    if (type === "divider") {
      newBlock = {
        id: newBlockId,
        type: "divider",
        bgColor: "bg-slate-300",
        imageHeight: "2px",
        blockWidth: "max-w-2xl",
        imageMarginTop: "24",
        imageMarginBottom: "24"
      };
    } else if (type === "hero") {
      newBlock = {
        id: newBlockId,
        type: "hero",
        title: "새로운 헤드라인 문구",
        subtitle: "여기에 메인 서브설명을 직접 수정해 보세요.",
        badge: "탑정보통신 2026 비즈니스 패밀리쉽",
        align: "center",
        buttonText: "가맹가입 신청",
        buttonLink: "request_consult"
      };
    } else if (type === "features") {
      newBlock = {
        id: newBlockId,
        type: "features",
        title: "새로운 핵심 메리트 타이틀",
        subtitle: "여기에 메리트에 대해 간략히 설명해 주세요.",
        items: [
          { title: "첫 번째 우대혜택", desc: "이 혜택에 대한 매력적인 내용을 서술해 주세요." },
          { title: "두 번째 우대혜택", desc: "이 혜택에 대한 매력적인 내용을 서술해 주세요." }
        ]
      };
    } else if (type === "banner") {
      newBlock = {
        id: newBlockId,
        type: "banner",
        title: "지금 즉시 가입 상담 신청하기",
        subtitle: "탑정보통신 특별 24시간 실시간 배송 연동 지원",
        buttonText: "전화 신청",
        buttonLink: "request_consult"
      };
    } else if (type === "image") {
      newBlock = {
        id: newBlockId,
        type: "image",
        title: "신규 명품 제휴 단말 라인업",
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
        buttonText: "가맹 우대 혜택 알아보기",
        buttonLink: "request_consult"
      };
    } else {
      newBlock = {
        id: newBlockId,
        type: "text",
        title: "일반 텍스트 섹션",
        content: "여기에 긴 설명글이나 약관 또는 회사 연혁 등의 영수증 단말기 제휴 안내글을 마음껏 서술할 수 있습니다."
      };
    }

    const updatedBlocks = [...page.blocks];
    updatedBlocks.splice(index + 1, 0, newBlock);
    try {
      await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
      setShowAddBlockMenuAtIndex(null);
    } catch (e) {
      console.error("Insert block fails: ", e);
    }
  };

  const handleUpdateBlockData = async (page: CMSPage, blockId: string, fields: Partial<CMSBlock>) => {
    const updatedBlocks = page.blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, ...fields };
      }
      return b;
    });
    try {
      await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
    } catch (e) {
      console.error("Firestore immediate block update failed: ", e);
    }
  };

  const handleHUDChange = async (fields: Partial<CMSBlock>) => {
    if (!activeEditTarget || !activeEditTarget.blockId) return;
    const { page, blockId, block } = activeEditTarget;
    
    const updatedBlocks = page.blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, ...fields };
      }
      return b;
    });

    const updatedPages = pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p);
    setPages(updatedPages);

    setActiveEditTarget({
      ...activeEditTarget,
      block: { ...block, ...fields } as CMSBlock,
      page: { ...page, blocks: updatedBlocks }
    });

    try {
      await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
    } catch (err) {
      console.error("Real-time HUD update failed: ", err);
    }
  };

  const handleHUDCardChange = async (cardItemFields: any) => {
    if (!activeEditTarget || !activeEditTarget.blockId || activeEditTarget.itemIndex === undefined) return;
    const { page, blockId, block, itemIndex } = activeEditTarget;
    
    const currentItems = [...(block?.items || [])];
    currentItems[itemIndex] = { ...currentItems[itemIndex], ...cardItemFields };

    const updatedBlocks = page.blocks.map(b => {
      if (b.id === blockId) {
        return { ...b, items: currentItems };
      }
      return b;
    });

    const updatedPages = pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p);
    setPages(updatedPages);

    setActiveEditTarget({
      ...activeEditTarget,
      block: { ...block, items: currentItems } as CMSBlock,
      page: { ...page, blocks: updatedBlocks }
    });

    try {
      await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
    } catch (err) {
      console.error("Real-time HUD card update failed: ", err);
    }
  };

  const handleHUDDeleteCardItem = async () => {
    if (!activeEditTarget || !activeEditTarget.blockId || activeEditTarget.itemIndex === undefined) return;
    const { page, blockId, block, itemIndex } = activeEditTarget;

    setCustomConfirm({
      show: true,
      title: "카드 삭제 확인",
      message: "이 카드를 영구 삭제하시겠습니까?",
      onConfirm: async () => {
        const currentItems = (block?.items || []).filter((_, idx) => idx !== itemIndex);

        const updatedBlocks = page.blocks.map(b => {
          if (b.id === blockId) {
            return { ...b, items: currentItems };
          }
          return b;
        });

        const updatedPages = pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p);
        setPages(updatedPages);

        setActiveEditTarget(null);

        try {
          await updateDoc(doc(db, "cms_pages", page.id), { blocks: updatedBlocks });
        } catch (err) {
          console.error("Real-time HUD card deletion failed: ", err);
        }
      }
    });
  };

  const handleNavTitleChange = async (newTitle: string) => {
    if (!activeEditTarget || !activeEditTarget.page) return;
    const pId = activeEditTarget.page.id;

    const updatedPages = pages.map(p => p.id === pId ? { ...p, title: newTitle } : p);
    setPages(updatedPages);

    setActiveEditTarget({
      ...activeEditTarget,
      page: { ...activeEditTarget.page, title: newTitle }
    });

    try {
      await updateDoc(doc(db, "cms_pages", pId), { title: newTitle });
    } catch (err) {
      console.error("Failed to update nav tab title: ", err);
    }
  };

  const handleLinkClick = (target: string) => {
    setCurrentUrl(target);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <TopWebsiteView
        currentUrl={currentUrl}
        setCurrentUrl={setCurrentUrl}
        pages={pages}
        setPages={setPages}
        products={products}
        setProducts={setProducts}
        productFilter={productFilter}
        setProductFilter={setProductFilter}
        isEditModeActive={isEditModeActive}
        setIsEditModeActive={setIsEditModeActive}
        activeEditTarget={activeEditTarget}
        setActiveEditTarget={setActiveEditTarget}
        footerInfo={footerInfo}
        setFooterInfo={setFooterInfo}
        user={user}
        profile={profile}
        logout={logout}
        isEmployee={isEmployee}
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
        authFormData={authFormData}
        setAuthFormData={setAuthFormData}
        authError={authError}
        authLoading={authLoading}
        handleAuthSubmit={handleAuthSubmit}
        showGoogleLogin={showGoogleLogin}
        setShowGoogleLogin={setShowGoogleLogin}
        handleGoogleLogin={handleGoogleLogin}
        googleClickTimes={googleClickTimes}
        setGoogleClickTimes={setGoogleClickTimes}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setIsSignUpMode={setIsSignUpMode}
        handleLinkClick={handleLinkClick}
        handleMoveBlockUp={handleMoveBlockUp}
        handleMoveBlockDown={handleMoveBlockDown}
        handleDeleteBlock={handleDeleteBlock}
        handleInsertBlock={handleInsertBlock}
        handleUpdateBlockData={handleUpdateBlockData}
        handleHUDChange={handleHUDChange}
        handleHUDCardChange={handleHUDCardChange}
        handleHUDDeleteCardItem={handleHUDDeleteCardItem}
        handleNavTitleChange={handleNavTitleChange}
        showAddBlockMenuAtIndex={showAddBlockMenuAtIndex}
        setShowAddBlockMenuAtIndex={setShowAddBlockMenuAtIndex}
        onEnterInternalDashboard={onEnterInternalDashboard}
        isAdmin={isAdmin}
        db={db}
      />

      {customConfirm && customConfirm.show && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-950/65 border border-red-800/35 rounded-2xl text-red-400">
                <Trash2 className="w-5 h-5 animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-white leading-tight">{customConfirm.title}</h4>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed text-left">{customConfirm.message}</p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCustomConfirm(null)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-755 text-xs font-bold rounded-xl transition text-slate-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  customConfirm.onConfirm();
                  setCustomConfirm(null);
                }}
                className="flex-1 py-2.5 px-4 bg-red-650 hover:bg-red-700 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-600/15 transition"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {customAlert && customAlert.show && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-950/65 border border-blue-800/35 rounded-2xl text-blue-400">
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </div>
              <h4 className="text-base font-bold text-white leading-tight">{customAlert.title}</h4>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed text-left">{customAlert.message}</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCustomAlert(null)}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-lg shadow-blue-600/15 transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
