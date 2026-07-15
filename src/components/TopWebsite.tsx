import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, setDoc, updateDoc, getDoc, getDocs, writeBatch, deleteField } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { CMSPage, Product, CMSBlock, NavigationSettings } from "../types";
import { DEFAULT_NAVIGATION_SETTINGS, PUBLIC_DESIGN_VERSION, createDefaultCMSPages, mergeNavigationSettings, restoreStandardCMSPages } from "../utils/cmsSettings";
import { DEFAULT_FOOTER_INFO, footerInfoNeedsMigration, mergeFooterInfo } from "../utils/footerSettings";
import { createVerifiedPublicProducts, normalizeKnownSeedProducts } from "../utils/publicProducts";
import { TopWebsiteView } from "./TopWebsiteView";
import { Trash2, Sparkles } from "lucide-react";

interface TopWebsiteProps {
  onEnterInternalDashboard: () => void;
}

function getFirebaseErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code?: unknown }).code || "");
  }
  return "";
}

function getGoogleLoginErrorMessage(error: unknown) {
  const code = getFirebaseErrorCode(error);
  const currentHost = window.location.hostname || "현재 접속 주소";

  if (code === "auth/operation-not-allowed") {
    return "Firebase Authentication에서 Google 로그인 제공업체가 꺼져 있습니다. Firebase 콘솔에서 Google 제공업체를 활성화해야 합니다.";
  }

  if (code === "auth/unauthorized-domain") {
    return `${currentHost} 도메인이 Firebase Auth 허용 도메인에 등록되어 있지 않습니다. Firebase 콘솔 Authentication 설정에서 허용 도메인에 추가해야 합니다.`;
  }

  if (code === "auth/popup-blocked") {
    return "브라우저가 Google 인증 팝업을 차단했습니다. 다시 시도하면 redirect 방식으로 인증을 진행합니다.";
  }

  if (code === "auth/popup-closed-by-user") {
    return "Google 인증 창이 닫혀 로그인되지 않았습니다.";
  }

  if (code === "auth/cancelled-popup-request") {
    return "이미 진행 중인 Google 인증 요청이 취소되었습니다. 잠시 후 다시 시도해 주세요.";
  }

  return `Google Workspace 연동인증에 실패했습니다.${code ? ` (${code})` : ""}`;
}

export function TopWebsite({ onEnterInternalDashboard }: TopWebsiteProps) {
  const { user, profile, logout, emailLogin, emailSignUp, login, setIsAccessCodeVerified, isAdmin, isEmployee } = useAuth();

  // Navigation states
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    if (typeof window === "undefined") return "home";
    return new URLSearchParams(window.location.search).get("page") || "home";
  });
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
  const defaultCmsPages = React.useMemo(() => createDefaultCMSPages(), []);
  const [pages, setPages] = useState<CMSPage[]>(defaultCmsPages);
  const [products, setProducts] = useState<Product[]>([]);
  const [navigationSettings, setNavigationSettings] = useState<NavigationSettings>(DEFAULT_NAVIGATION_SETTINGS);

  // Local active product tab
  const [productFilter, setProductFilter] = useState<string>("전체");

  useEffect(() => {
    if (!isEmployee && currentUrl === "admin") {
      setCurrentUrl("home");
      setMobileMenuOpen(false);
    }
    if (currentUrl !== "admin" && pages.length > 0 && !pages.some((page) => page.slug === currentUrl)) {
      setCurrentUrl("home");
      setMobileMenuOpen(false);
    }
    if (!isAdmin && isEditModeActive) {
      setIsEditModeActive(false);
      setActiveEditTarget(null);
      setShowAddBlockMenuAtIndex(null);
    }
  }, [currentUrl, isAdmin, isEditModeActive, isEmployee, pages]);

  useEffect(() => {
    const syncPageFromHistory = () => {
      const page = new URLSearchParams(window.location.search).get("page") || "home";
      setCurrentUrl(page);
      setMobileMenuOpen(false);
    };
    window.addEventListener("popstate", syncPageFromHistory);
    return () => window.removeEventListener("popstate", syncPageFromHistory);
  }, []);

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

  const [isCmsSaving, setIsCmsSaving] = useState(false);
  const [isCmsPublishing, setIsCmsPublishing] = useState(false);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const pendingWritesRef = React.useRef<Record<string, { pageId: string; blocks: CMSPage["blocks"] }>>({});
  const writeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const pendingNavWritesRef = React.useRef<{
    pId: string;
    title: string;
    navigationSettings: NavigationSettings;
  } | null>(null);
  const navWriteTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const pendingProductWritesRef = React.useRef<Record<string, Partial<Product>>>({});
  const productWriteTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (writeTimeoutRef.current) clearTimeout(writeTimeoutRef.current);
      if (navWriteTimeoutRef.current) clearTimeout(navWriteTimeoutRef.current);
      if (productWriteTimeoutRef.current) clearTimeout(productWriteTimeoutRef.current);
    };
  }, []);

  const schedulePageWrite = (pageId: string, blocks: CMSPage["blocks"]) => {
    pendingWritesRef.current[pageId] = { pageId, blocks };
    setIsCmsSaving(true);
    setHasUnpublishedChanges(true);

    if (writeTimeoutRef.current) {
      clearTimeout(writeTimeoutRef.current);
    }

    writeTimeoutRef.current = setTimeout(async () => {
      const pending = { ...pendingWritesRef.current };
      pendingWritesRef.current = {};

      for (const pId in pending) {
        const { blocks: blocksToWrite } = pending[pId];
        try {
          await updateDoc(doc(db, "cms_pages", pId), { draftBlocks: blocksToWrite, designVersion: PUBLIC_DESIGN_VERSION });
          console.log(`[CMS] Debounced write success for page ${pId}`);
        } catch (e) {
          console.error(`[CMS] Debounced write failed for page ${pId}:`, e);
        }
      }
      setIsCmsSaving(false);
    }, 1000);
  };

  const scheduleNavWrite = (pId: string, title: string, updatedSettings: NavigationSettings) => {
    pendingNavWritesRef.current = { pId, title, navigationSettings: updatedSettings };
    setIsCmsSaving(true);

    if (navWriteTimeoutRef.current) {
      clearTimeout(navWriteTimeoutRef.current);
    }

    navWriteTimeoutRef.current = setTimeout(async () => {
      if (!pendingNavWritesRef.current) return;
      const { pId: targetId, title: targetTitle, navigationSettings: targetSettings } = pendingNavWritesRef.current;
      pendingNavWritesRef.current = null;

      try {
        await updateDoc(doc(db, "cms_pages", targetId), { title: targetTitle });
        await setDoc(doc(db, "settings", "navigation"), targetSettings);
        console.log(`[CMS] Debounced nav write success`);
      } catch (e) {
        console.error(`[CMS] Debounced nav write failed:`, e);
      }
      setIsCmsSaving(false);
    }, 1000);
  };

  const scheduleProductWrite = (productId: string, fields: Partial<Product>) => {
    pendingProductWritesRef.current[productId] = {
      ...pendingProductWritesRef.current[productId],
      ...fields
    };
    setIsCmsSaving(true);

    if (productWriteTimeoutRef.current) {
      clearTimeout(productWriteTimeoutRef.current);
    }

    productWriteTimeoutRef.current = setTimeout(async () => {
      const pending = { ...pendingProductWritesRef.current };
      pendingProductWritesRef.current = {};

      for (const prodId in pending) {
        const dataToWrite = pending[prodId];
        try {
          await updateDoc(doc(db, "products", prodId), dataToWrite);
          console.log(`[CMS] Debounced write success for product ${prodId}`);
        } catch (e) {
          console.error(`[CMS] Debounced write failed for product ${prodId}:`, e);
        }
      }
      setIsCmsSaving(false);
    }, 1000);
  };

  const [footerInfo, setFooterInfo] = useState(DEFAULT_FOOTER_INFO);

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
    const handleCmsPagesData = async (snap: any) => {
      const items: CMSPage[] = [];
      let hasDrafts = false;
      snap.forEach((d: any) => {
        const data = d.data() as CMSPage;
        const draftBlocks = Array.isArray(data.draftBlocks) ? data.draftBlocks : null;
        if (isEmployee && draftBlocks) hasDrafts = true;
        items.push({
          id: d.id,
          ...data,
          blocks: isEmployee && draftBlocks ? draftBlocks : data.blocks,
        } as CMSPage);
      });
      if (isEmployee) setHasUnpublishedChanges(hasDrafts);

      const renderableItems = restoreStandardCMSPages(items, defaultCmsPages);

      // Sanitize and auto-correct extreme positions (e.g. lost dragged blocks)
      // Also ensure custom function pages have the 'custom_board' block in their blocks list
      const sanitizedItems = renderableItems.map(page => {
        let pageModified = false;

        // 1. Sanitize standard positions
        const pageBlocks = Array.isArray(page.blocks) ? page.blocks : [];
        const sanitizedBlocks = pageBlocks.map(block => {
          let blockModified = false;
          let nextBlock = { ...block };

          if (typeof block.posY === 'number' && block.posY < -150) {
            nextBlock.posY = 0;
            blockModified = true;
          }
          if (typeof block.posX === 'number' && (block.posX < -600 || block.posX > 600)) {
            nextBlock.posX = 0;
            blockModified = true;
          }

          if (blockModified) {
            pageModified = true;
          }
          return nextBlock;
        });

        // 2. Ensure custom function pages have the custom_board block
        const customSlugs = ["products", "request_consult", "request_paper", "board_suggestions", "board_resources"];
        let nextBlocks = [...sanitizedBlocks];
        let markCustomBoardInitialized = false;

        if (page.slug === "board_resources" || page.slug === "board_suggestions") {
          const hasOldCustomBoard = nextBlocks.some(b => b.type === "custom_board" && !b.boardPart);
          const hasHeader = nextBlocks.some(b => b.type === "custom_board" && b.boardPart === "header");
          const hasSearch = nextBlocks.some(b => b.type === "custom_board" && b.boardPart === "search");
          const hasBody = nextBlocks.some(b => b.type === "custom_board" && b.boardPart === "body");
          const hasAnyBoardPart = hasHeader || hasSearch || hasBody;
          const shouldInitializeBoardParts =
            hasOldCustomBoard ||
            (!page.customBoardInitialized && (!hasAnyBoardPart || !hasHeader || !hasSearch || !hasBody));

          if (shouldInitializeBoardParts) {
            nextBlocks = nextBlocks.filter(b => !(b.type === "custom_board" && !b.boardPart));

            if (!nextBlocks.some(b => b.type === "custom_board" && b.boardPart === "header")) {
              nextBlocks.push({
                id: "custom_board_" + page.id + "_header",
                type: "custom_board",
                boardPart: "header"
              });
            }
            if (!nextBlocks.some(b => b.type === "custom_board" && b.boardPart === "search")) {
              nextBlocks.push({
                id: "custom_board_" + page.id + "_search",
                type: "custom_board",
                boardPart: "search"
              });
            }
            if (!nextBlocks.some(b => b.type === "custom_board" && b.boardPart === "body")) {
              nextBlocks.push({
                id: "custom_board_" + page.id + "_body",
                type: "custom_board",
                boardPart: "body"
              });
            }
            pageModified = true;
            markCustomBoardInitialized = true;
          } else if (!page.customBoardInitialized && hasAnyBoardPart) {
            pageModified = true;
            markCustomBoardInitialized = true;
          }
        } else if (customSlugs.includes(page.slug)) {
          const hasCustomBoard = nextBlocks.some(b => b.type === "custom_board");

          if (!page.customBoardInitialized && !hasCustomBoard) {
            nextBlocks.push({
              id: "custom_board_" + page.id,
              type: "custom_board"
            });
            pageModified = true;
            markCustomBoardInitialized = true;
          } else if (!page.customBoardInitialized && hasCustomBoard) {
            pageModified = true;
            markCustomBoardInitialized = true;
          }
        }

        if (pageModified) {
          if (isEmployee) {
            const payload: Partial<CMSPage> = { draftBlocks: nextBlocks, designVersion: PUBLIC_DESIGN_VERSION };
            if (markCustomBoardInitialized) {
              payload.customBoardInitialized = true;
            }

            updateDoc(doc(db, "cms_pages", page.id), payload).catch(err => {
              console.warn(`[CMS AutoCorrect] Quiet sync failed for page ${page.id}:`, err);
            });
          }
          return {
            ...page,
            blocks: nextBlocks,
            ...(markCustomBoardInitialized ? { customBoardInitialized: true } : {}),
          };
        }
        return page;
      });

      // Automate restoration of any missing standard pages to ensure all menus are present.
      const defaultPages = defaultCmsPages;

      const existingIds = items.map(p => p.id);

      for (const dp of defaultPages) {
        if (!existingIds.includes(dp.id)) {
          if (isEmployee) {
            console.log(`[CMS Init] Missing standard page '${dp.id}', auto-populating...`);
            setDoc(doc(db, "cms_pages", dp.id), dp).catch((err) => {
              console.warn(`[CMS Init] Missing standard page sync failed for '${dp.id}':`, err);
            });
          }
        }
      }

      setPages(sanitizedItems);
    };

    const handleProductsData = async (snap: any) => {
      const storedProducts: Product[] = [];
      snap.forEach((d: any) => storedProducts.push({ id: d.id, ...d.data() } as Product));
      const normalized = normalizeKnownSeedProducts(storedProducts);

      const initDocRef = doc(db, "settings", "initialization_state");
      try {
        const initSnap = await getDoc(initDocRef);

        if (storedProducts.length === 0 && !initSnap.exists()) {
          const defaultProducts = createVerifiedPublicProducts();
          if (!isEmployee) {
            setProducts(defaultProducts);
            return;
          }

          console.log("Empty products collection and uninitialized database. Initializing defaults...");
          const batch = writeBatch(db);
          defaultProducts.forEach((product) => batch.set(doc(db, "products", product.id), product));
          batch.set(initDocRef, { initialized: true });
          await batch.commit();
          setProducts(defaultProducts);
        } else {
          setProducts(normalized.products);

          if (isEmployee && normalized.migratedIds.length > 0) {
            const batch = writeBatch(db);
            normalized.migratedIds.forEach((productId) => {
              const replacement = normalized.products.find((product) => product.id === productId);
              if (replacement) batch.set(doc(db, "products", productId), replacement);
            });
            await batch.commit();
          }

          if (isEmployee && !initSnap.exists() && storedProducts.length > 0) {
            await setDoc(initDocRef, { initialized: true });
          }
        }
      } catch (err) {
        console.error("Initialization state check failed: ", err);
        setProducts(normalized.products.length > 0 ? normalized.products : createVerifiedPublicProducts());
      }
    };

    const handleNavData = (snap: any) => {
      if (!snap.exists()) {
        setNavigationSettings(DEFAULT_NAVIGATION_SETTINGS);
        if (isEmployee) {
          setDoc(doc(db, "settings", "navigation"), DEFAULT_NAVIGATION_SETTINGS).catch((err) => {
            console.warn("Navigation settings initialization failed", err);
          });
        }
      } else {
        setNavigationSettings(mergeNavigationSettings(snap.data() as NavigationSettings));
      }
    };

    const handleFooterData = (snap: any) => {
      if (snap.exists()) {
        const storedFooter = snap.data();
        const mergedFooter = mergeFooterInfo(storedFooter);
        setFooterInfo(mergedFooter);
        if (isEmployee && footerInfoNeedsMigration(storedFooter)) {
          setDoc(doc(db, "settings", "footer"), mergedFooter).catch((err) => {
            console.warn("Footer company info migration failed", err);
          });
        }
      } else {
        setFooterInfo(DEFAULT_FOOTER_INFO);
        if (isEmployee) {
          setDoc(doc(db, "settings", "footer"), DEFAULT_FOOTER_INFO).catch((err) => {
            console.warn("Footer settings initialization failed", err);
          });
        }
      }
    };

    let unsubPages: (() => void) | null = null;
    let unsubProducts: (() => void) | null = null;
    let unsub_nav: (() => void) | null = null;
    let unsub_footer: (() => void) | null = null;

    if (isEmployee) {
      console.log("[CMS] Subscribing to real-time Firestore updates for employee...");
      unsubPages = onSnapshot(collection(db, "cms_pages"), handleCmsPagesData, (err) => {
        console.error("CMS pages listener failed. Rendering local default pages instead:", err);
        setPages(defaultCmsPages);
      });

      unsubProducts = onSnapshot(collection(db, "products"), handleProductsData, (err) => {
        console.error("Products listener failed. Rendering without product data:", err);
        setProducts([]);
      });

      unsub_nav = onSnapshot(doc(db, "settings", "navigation"), handleNavData, (err) => {
        console.error("Navigation settings listener failed. Using defaults:", err);
        setNavigationSettings(DEFAULT_NAVIGATION_SETTINGS);
      });

      unsub_footer = onSnapshot(doc(db, "settings", "footer"), handleFooterData, (err) => {
        console.error("Footer settings listener failed. Keeping current footer info:", err);
      });
    } else {
      console.log("[CMS] Performing one-time Firestore get fetches for public visitor...");
      getDocs(collection(db, "cms_pages"))
        .then(handleCmsPagesData)
        .catch((err) => {
          console.error("One-time CMS pages fetch failed. Rendering local default pages instead:", err);
          setPages(defaultCmsPages);
        });

      getDocs(collection(db, "products"))
        .then(handleProductsData)
        .catch((err) => {
          console.error("One-time Products fetch failed. Rendering without product data:", err);
          setProducts([]);
        });

      getDoc(doc(db, "settings", "navigation"))
        .then(handleNavData)
        .catch((err) => {
          console.error("One-time Navigation settings fetch failed. Using defaults:", err);
          setNavigationSettings(DEFAULT_NAVIGATION_SETTINGS);
        });

      getDoc(doc(db, "settings", "footer"))
        .then(handleFooterData)
        .catch((err) => {
          console.error("One-time Footer settings fetch failed. Keeping current footer info:", err);
        });
    }

    return () => {
      if (unsubPages) unsubPages();
      if (unsubProducts) unsubProducts();
      if (unsub_nav) unsub_nav();
      if (unsub_footer) unsub_footer();
    };
  }, [user, isEmployee, defaultCmsPages]);

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
          "현장 관리자",
          ""
        );
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
      setAuthError(getGoogleLoginErrorMessage(err));
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
      await updateDoc(doc(db, "cms_pages", page.id), { draftBlocks: updatedBlocks, designVersion: PUBLIC_DESIGN_VERSION });
      setHasUnpublishedChanges(true);
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
      await updateDoc(doc(db, "cms_pages", page.id), { draftBlocks: updatedBlocks, designVersion: PUBLIC_DESIGN_VERSION });
      setHasUnpublishedChanges(true);
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
          await updateDoc(doc(db, "cms_pages", page.id), { draftBlocks: updatedBlocks, designVersion: PUBLIC_DESIGN_VERSION });
          setHasUnpublishedChanges(true);
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
        imageUrl: "/assets/product/toss-front.webp",
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
      await updateDoc(doc(db, "cms_pages", page.id), { draftBlocks: updatedBlocks, designVersion: PUBLIC_DESIGN_VERSION });
      setHasUnpublishedChanges(true);
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

    const updatedPages = pages.map(p => p.id === page.id ? { ...p, blocks: updatedBlocks } : p);
    setPages(updatedPages);

    schedulePageWrite(page.id, updatedBlocks);
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

    schedulePageWrite(page.id, updatedBlocks);
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

    schedulePageWrite(page.id, updatedBlocks);
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
          await updateDoc(doc(db, "cms_pages", page.id), { draftBlocks: updatedBlocks, designVersion: PUBLIC_DESIGN_VERSION });
          setHasUnpublishedChanges(true);
        } catch (err) {
          console.error("Real-time HUD card deletion failed: ", err);
        }
      }
    });
  };

  const handleNavTitleChange = async (newTitle: string) => {
    if (!activeEditTarget || !activeEditTarget.page) return;
    const pId = activeEditTarget.page.id;
    const slug = activeEditTarget.page.slug;

    const updatedPages = pages.map(p => p.id === pId ? { ...p, title: newTitle } : p);
    setPages(updatedPages);

    const updatedNavigationSettings = {
      ...mergeNavigationSettings(navigationSettings),
      [slug]: {
        ...mergeNavigationSettings(navigationSettings)[slug],
        label: newTitle,
      },
    };
    setNavigationSettings(updatedNavigationSettings);

    setActiveEditTarget({
      ...activeEditTarget,
      page: { ...activeEditTarget.page, title: newTitle }
    });

    scheduleNavWrite(pId, newTitle, updatedNavigationSettings);
  };

  const handleNavVisibilityChange = async (visible: boolean) => {
    if (!activeEditTarget || !activeEditTarget.page) return;
    const slug = activeEditTarget.page.slug;
    const mergedSettings = mergeNavigationSettings(navigationSettings);
    const updatedNavigationSettings = {
      ...mergedSettings,
      [slug]: {
        ...mergedSettings[slug],
        visible,
      },
    };

    setNavigationSettings(updatedNavigationSettings);

    try {
      await setDoc(doc(db, "settings", "navigation"), updatedNavigationSettings);
    } catch (err) {
      console.error("Failed to update nav visibility: ", err);
    }
  };

  const handleLinkClick = (target: string) => {
    if (/^https?:\/\//i.test(target)) {
      window.open(target, "_blank", "noopener,noreferrer");
      return;
    }
    if (/^(tel:|mailto:)/i.test(target)) {
      window.location.href = target;
      return;
    }
    if (target.startsWith("#")) {
      document.getElementById(target.slice(1).split(":")[0])?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const [pageTarget, rawQuery = ""] = target.split("?", 2);
    const nextPage = pageTarget || "home";
    const nextLocation = new URL(window.location.href);
    nextLocation.search = "";
    nextLocation.hash = "";
    if (nextPage !== "home") nextLocation.searchParams.set("page", nextPage);
    new URLSearchParams(rawQuery).forEach((value, key) => nextLocation.searchParams.set(key, value));
    window.history.pushState({ page: nextPage }, "", `${nextLocation.pathname}${nextLocation.search}`);
    setCurrentUrl(nextPage);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePublishWebsite = async () => {
    if (!isEmployee || isCmsPublishing) return;

    setIsCmsPublishing(true);
    try {
      const batch = writeBatch(db);
      pages.forEach((page) => {
        batch.set(
          doc(db, "cms_pages", page.id),
          {
            blocks: page.blocks,
            draftBlocks: deleteField(),
            designVersion: PUBLIC_DESIGN_VERSION,
          },
          { merge: true }
        );
      });
      await batch.commit();
      setHasUnpublishedChanges(false);
      setCustomAlert({
        show: true,
        title: "홈페이지 게시 완료",
        message: "현재 미리보기 내용이 공개 홈페이지에 반영되었습니다.",
      });
    } catch (error) {
      console.error("Website publish failed:", error);
      setCustomAlert({
        show: true,
        title: "게시 실패",
        message: "홈페이지 게시 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setIsCmsPublishing(false);
    }
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
        scheduleProductWrite={scheduleProductWrite}
        schedulePageWrite={schedulePageWrite}
        productFilter={productFilter}
        setProductFilter={setProductFilter}
        isEditModeActive={isEditModeActive}
        setIsEditModeActive={setIsEditModeActive}
        activeEditTarget={activeEditTarget}
        setActiveEditTarget={setActiveEditTarget}
        footerInfo={footerInfo}
        setFooterInfo={setFooterInfo}
        navigationSettings={navigationSettings}
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
        isSignUpMode={isSignUpMode}
        setIsSignUpMode={setIsSignUpMode}
        isCmsSaving={isCmsSaving}
        isCmsPublishing={isCmsPublishing}
        hasUnpublishedChanges={hasUnpublishedChanges}
        onPublishWebsite={handlePublishWebsite}
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
        handleNavVisibilityChange={handleNavVisibilityChange}
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
