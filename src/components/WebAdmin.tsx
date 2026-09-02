import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, addDoc, writeBatch } from "firebase/firestore";
import { Trash, Edit, Plus, Check, FileCode, ShoppingBag, Eye, EyeOff, LayoutTemplate, Layers, ClipboardList, Info, HelpCircle } from "lucide-react";
import { CMSPage, CMSBlock, Product, Consultation, PaperRequest } from "../types";
import { useToast } from "../contexts/ToastContext";
import { PUBLIC_DESIGN_VERSION } from "../utils/cmsSettings";
import { auditProductMediaForPublication } from "../utils/cmsMediaAudit";

interface WebAdminProps {
  onOpenTasks: () => void;
}

function saveAdminPageDraft(pageId: string, blocks: CMSPage["blocks"]) {
  return setDoc(doc(db, "cms_page_drafts", pageId), {
    blocks,
    designVersion: PUBLIC_DESIGN_VERSION,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export function WebAdmin({ onOpenTasks }: WebAdminProps) {
  const [activeSubTab, setActiveSubTab] = useState<"cms" | "products" | "consultations" | "papers">("cms");
  const { showToast } = useToast();
  
  // States
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [consults, setConsults] = useState<Consultation[]>([]);
  const [papers, setPapers] = useState<PaperRequest[]>([]);
  const [loadError, setLoadError] = useState("");

  // Page Editor States
  const [selectedPage, setSelectedPage] = useState<CMSPage | null>(null);
  const [newPageName, setNewPageName] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");

  // Product Form States
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductListOpen, setIsProductListOpen] = useState(true);
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null);

  const confirmDeleteAction = (key: string) => {
    if (deleteConfirmKey !== key) {
      setDeleteConfirmKey(key);
      return false;
    }

    setDeleteConfirmKey(null);
    return true;
  };

  useEffect(() => {
    // Subscriber CMS Pages
    const publishedPages = new Map<string, CMSPage>();
    const pageDrafts = new Map<string, CMSPage["blocks"]>();
    const emitPages = () => {
      const items = [...publishedPages.values()].map((page) => ({
        ...page,
        blocks: pageDrafts.get(page.id) || page.blocks,
      }));
      setPages(items);
      setSelectedPage((current) => current
        ? items.find((item) => item.id === current.id) || items[0] || null
        : items[0] || null);
    };
    const unsubPages = onSnapshot(collection(db, "cms_pages"), (snap) => {
      publishedPages.clear();
      snap.forEach(d => {
        const data = { ...(d.data() as CMSPage) };
        delete data.draftBlocks;
        publishedPages.set(d.id, { id: d.id, ...data } as CMSPage);
      });
      emitPages();
    }, (err) => {
      console.error("CMS pages listener failed:", err);
      setLoadError("홈페이지 페이지 정보를 불러오지 못했습니다.");
    });
    const unsubDrafts = onSnapshot(collection(db, "cms_page_drafts"), (snap) => {
      pageDrafts.clear();
      snap.forEach((draftDoc) => {
        const blocks = draftDoc.data().blocks;
        if (Array.isArray(blocks)) pageDrafts.set(draftDoc.id, blocks as CMSPage["blocks"]);
      });
      emitPages();
    }, (err) => {
      console.error("CMS draft listener failed:", err);
      setLoadError("홈페이지 초안을 불러오지 못했습니다.");
    });

    // Subscriber Products
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      const items: Product[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() } as Product));
      setProducts(items);
    }, (err) => {
      console.error("Products listener failed:", err);
      setLoadError("제품 정보를 불러오지 못했습니다.");
    });

    // Subscriber Consultations
    const unsubConsults = onSnapshot(collection(db, "consultations"), (snap) => {
      const items: Consultation[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() } as Consultation));
      items.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setConsults(items);
    }, (err) => {
      console.error("Consultations listener failed:", err);
      setLoadError("상담 신청 내역을 불러오지 못했습니다.");
    });

    // Subscriber Paper Requests
    const unsubPapers = onSnapshot(collection(db, "paper_requests"), (snap) => {
      const items: PaperRequest[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() } as PaperRequest));
      items.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPapers(items);
    }, (err) => {
      console.error("Paper requests listener failed:", err);
      setLoadError("용지 신청 내역을 불러오지 못했습니다.");
    });

    return () => {
      unsubPages();
      unsubDrafts();
      unsubProducts();
      unsubConsults();
      unsubPapers();
    };
  }, []);

  // --- CMS Page builders ---
  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageName || !newPageSlug) return;
    const slugLower = newPageSlug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
    
    // Default page layout template
    const newPageItem: CMSPage = {
      id: slugLower,
      title: newPageName,
      slug: slugLower,
      isCustom: true,
      createdAt: new Date().toISOString(),
      blocks: [
        {
          id: "block-" + Math.random().toString(36).substring(2, 9),
          type: "hero",
          title: "새로운 제작 페이지",
          subtitle: "설명 텍스트를 기재해 주세요.",
          align: "center"
        }
      ]
    };

    try {
      await setDoc(doc(db, "cms_pages", slugLower), newPageItem);
      setSelectedPage(newPageItem);
      setNewPageName("");
      setNewPageSlug("");
    } catch (err) {
      showToast("데이터 저장 중 오류가 발생했습니다.", "error");
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (["home", "toss_pos", "uplus_ai_phone", "products", "industries", "promotion_pos", "used_pos", "support", "board_suggestions", "board_resources", "request_consult", "request_paper"].includes(pageId)) {
      showToast("기본 표준 시스템 페이지는 웹사이트 기둥이므로 삭제할 수 없습니다. 대신 상단 메뉴 라벨을 편집하시거나 비활성화해 사용하실 수 있습니다.", "warning");
      return;
    }
    if (!confirmDeleteAction(`page:${pageId}`)) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "cms_pages", pageId));
      batch.delete(doc(db, "cms_page_drafts", pageId));
      await batch.commit();
      setSelectedPage(pages.find(p => p.id !== pageId) || null);
    } catch (err) {
      showToast("페이지 삭제에 실패했습니다.", "error");
    }
  };

  const handleAddBlock = async (page: CMSPage, type: "hero" | "features" | "text" | "banner") => {
    let block: CMSBlock;
    if (type === "hero") {
      block = {
        id: "block-" + Math.random().toString(36).substring(2, 9),
        type: "hero",
        title: "새로운 헤드라인 문구",
        subtitle: "서브 타이틀 설명글입니다.",
        align: "center",
        buttonText: "이동하기",
        buttonLink: "request_consult"
      };
    } else if (type === "features") {
      block = {
        id: "block-" + Math.random().toString(36).substring(2, 9),
        type: "features",
        title: "핵심 메리트 혜택",
        subtitle: "제휴 시 특별히 주어지는 사항들입니다.",
        items: [
          { title: "첫 번째 기능", desc: "이 기능을 간략하게 써보세요." },
          { title: "두 번째 기능", desc: "이 기능을 간략하게 써보세요." }
        ]
      };
    } else if (type === "banner") {
      block = {
        id: "block-" + Math.random().toString(36).substring(2, 9),
        type: "banner",
        title: "지금 즉시 가입 상담 신청하기",
        subtitle: "상담 접수 후 담당자가 가능한 구성과 일정을 확인해 안내합니다.",
        buttonText: "전화 신청",
        buttonLink: "request_consult"
      };
    } else {
      block = {
        id: "block-" + Math.random().toString(36).substring(2, 9),
        type: "text",
        title: "일반 텍스트 문단",
        content: "여기에 길게 서술될 상세 안내글이나 회사 소개 또는 약관 등의 문안을 입력할 수 있습니다."
      };
    }

    const updatedBlocks = [...page.blocks, block];
    try {
      await saveAdminPageDraft(page.id, updatedBlocks);
      setSelectedPage({ ...page, blocks: updatedBlocks });
    } catch (err) {
      showToast("블록 추가에 실패했습니다.", "error");
    }
  };

  const handleUpdateBlockField = async (page: CMSPage, blockId: string, updates: Partial<CMSBlock>) => {
    const updatedBlocks = page.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b);
    try {
      await saveAdminPageDraft(page.id, updatedBlocks);
      setSelectedPage({ ...page, blocks: updatedBlocks });
    } catch (err) {
      showToast("블록 업데이트에 실패했습니다.", "error");
    }
  };

  const handleDeleteBlock = async (page: CMSPage, blockId: string) => {
    if (page.blocks.length <= 1) {
      showToast("페이지에는 최소 하나의 블록이 포함되어 있어야 합니다.", "warning");
      return;
    }
    if (!confirmDeleteAction(`block:${page.id}:${blockId}`)) return;
    const updatedBlocks = page.blocks.filter(b => b.id !== blockId);
    try {
      await saveAdminPageDraft(page.id, updatedBlocks);
      setSelectedPage({ ...page, blocks: updatedBlocks });
    } catch (err) {
      showToast("블록 삭제에 실패했습니다.", "error");
    }
  };

  // --- Product forms ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name) return;

    const prodId = editingProduct.id || Math.random().toString(36).substring(2, 9);
    const productData: Product = {
      id: prodId,
      name: editingProduct.name,
      category: editingProduct.category || "포스",
      description: editingProduct.description || "",
      imageUrl: editingProduct.imageUrl || "",
      price: editingProduct.price || "",
      features: editingProduct.features || ["삼성페이 지원", "간편결제 지원 여부 확인"],
      specs: editingProduct.specs || { "인터페이스": "LAN, USB", "디스플레이": "정전식 멀티터치" },
      createdAt: editingProduct.createdAt || new Date().toISOString(),
      ...(editingProduct.imageSourceUrl?.trim() ? { imageSourceUrl: editingProduct.imageSourceUrl.trim() } : {}),
      ...(editingProduct.imageRightsStatus ? { imageRightsStatus: editingProduct.imageRightsStatus } : {}),
    };

    const mediaIssues = auditProductMediaForPublication([productData]);
    if (mediaIssues.length > 0) {
      showToast(`제품 이미지 저장 차단: ${mediaIssues[0].reason}`, "error");
      return;
    }

    try {
      await setDoc(doc(db, "products", prodId), productData);
      setEditingProduct(null);
      setIsProductListOpen(true);
    } catch (err) {
      showToast("제품 정보 저장에 실패했습니다.", "error");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirmDeleteAction(`product:${productId}`)) return;
    try {
      await deleteDoc(doc(db, "products", productId));
    } catch (err) {
      showToast("제품 삭제에 실패했습니다.", "error");
    }
  };

  // --- Resolve inquiries ---
  const handleToggleConsultStatus = async (id: string, current: Consultation["status"]) => {
    try {
      await updateDoc(doc(db, "consultations", id), {
        status: current === "완료" ? "대기" : "완료",
      });
    } catch (err) {
      showToast("상태 변경에 실패했습니다.", "error");
    }
  };

  const handleTogglePaperStatus = async (id: string, current: PaperRequest["status"]) => {
    try {
      await updateDoc(doc(db, "paper_requests", id), {
        status: current === "완료" ? "대기" : "완료",
      });
    } catch (err) {
      showToast("상태 변경에 실패했습니다.", "error");
    }
  };

  const handleDeleteConsultation = async (id: string) => {
    const consultation = consults.find((item) => item.id === id);
    if (consultation?.linkedTaskId) {
      setDeleteConfirmKey(null);
      showToast("작업으로 등록된 상담 원본은 삭제할 수 없습니다.", "warning");
      return;
    }
    if (!confirmDeleteAction(`consult:${id}`)) return;
    try {
      await deleteDoc(doc(db, "consultations", id));
    } catch (err) {
      showToast("상담 신청 삭제에 실패했습니다.", "error");
    }
  };

  const handleDeletePaperRequest = async (id: string) => {
    const paperRequest = papers.find((item) => item.id === id);
    if (paperRequest?.linkedTaskId) {
      setDeleteConfirmKey(null);
      showToast("작업으로 등록된 용지 요청 원본은 삭제할 수 없습니다.", "warning");
      return;
    }
    if (!confirmDeleteAction(`paper:${id}`)) return;
    try {
      await deleteDoc(doc(db, "paper_requests", id));
    } catch (err) {
      showToast("용지 신청 삭제에 실패했습니다.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Admin Sidebar */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <LayoutTemplate className="w-6 h-6 text-blue-500" />
              탑관리 포털
            </h1>
            <p className="text-xs text-slate-500 mt-1">홈페이지 CMS + 가맹접수</p>
          </div>
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveSubTab("cms")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeSubTab === "cms" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Layers className="w-4 h-4" /> 홈페이지 편집 (Imweb)
            </button>
            <button
              onClick={() => setActiveSubTab("products")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeSubTab === "products" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> 단말기/포스 상품관리
            </button>
            <button
              onClick={() => setActiveSubTab("consultations")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeSubTab === "consultations" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <ClipboardList className="w-4 h-4" /> 가맹 상담 내역 ({consults.length})
            </button>
            <button
              onClick={() => setActiveSubTab("papers")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeSubTab === "papers" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <FileCode className="w-4 h-4" /> 용지 배송 신청 ({papers.length})
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onOpenTasks}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition text-center border border-slate-700"
          >
            기존 내부 업무관리 열기 →
          </button>
        </div>
      </div>

      {/* Admin Central Area */}
      <div className="flex-1 overflow-y-auto p-8 md:p-10">
        {loadError ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {loadError} Firebase 연결과 로그인 권한을 확인해 주세요.
          </div>
        ) : null}
        
        {/* --- Dynamic Page Builder --- */}
        {activeSubTab === "cms" && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-slate-800">홈페이지 메뉴 및 블록 제어 (아임웹 모델)</h2>
                <p className="text-sm text-slate-500 mt-1">서브 메뉴에 노출되는 페이지를 추가하고 화면 블록의 텍스트와 레이아웃을 실시간으로 관리하세요.</p>
              </div>
              
              {/* Creator menu */}
              <form onSubmit={handleCreatePage} className="flex gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
                <input
                  type="text"
                  required
                  placeholder="메뉴/페이지명"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  className="bg-transparent border-none text-xs text-slate-800 px-2 font-semibold focus:outline-none w-28"
                />
                <input
                  type="text"
                  required
                  placeholder="slug (영어소문자)"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  className="bg-transparent border-none text-xs text-slate-400 px-2 focus:outline-none w-28 font-mono border-l border-slate-200"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1 shrink-0 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> 추가
                </button>
              </form>
            </div>

            <div className="grid grid-cols-12 gap-8">
              {/* List of Pages */}
              <div className="col-span-3 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">활성 메뉴 목록</h3>
                <div className="space-y-1">
                  {pages.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPage(p)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition ${
                        selectedPage?.id === p.id ? "bg-slate-100 border border-slate-250 font-bold text-slate-900" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="truncate">
                        <span className="text-xs text-slate-400 font-mono block font-normal">/{p.slug}</span>
                        {p.title}
                      </div>
                      {p.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeletePage(p.id); }}
                          className={`shrink-0 rounded-lg p-1 text-[10px] font-bold transition ${
                            deleteConfirmKey === `page:${p.id}`
                              ? "bg-red-50 text-red-600 px-2"
                              : "text-slate-400 hover:text-red-500"
                          }`}
                          title={deleteConfirmKey === `page:${p.id}` ? "한 번 더 눌러 삭제 확정" : "페이지 삭제"}
                        >
                          {deleteConfirmKey === `page:${p.id}` ? "삭제확정" : <Trash className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-5 border-t border-slate-100 space-y-3 mt-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">💡 카테고리 / 사업자 팁</h4>
                  <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 text-xs text-blue-750 leading-relaxed space-y-1.5">
                    <p className="font-bold text-blue-600 flex items-center gap-1">🖥️ 실시간 인프라 가이드:</p>
                    <p className="text-[11px] text-slate-600">
                      <strong>탑정보통신 2026 비즈니스 패밀리쉽</strong> 문구, <strong>상단 카테고리 명칭(메뉴이름)</strong> 및 <strong>하단 사업자 정보</strong> 칸은, 메인 홈페이지로 이동 후 상단의 <span className="text-blue-600 font-bold">[편집 시작]</span> 버튼을 활성화하여 화면상에서 마우스로 직접 타이핑하여 즉시 실시간 영구 저장이 가능하도록 연계되어 있습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* Page Section Manager */}
              <div className="col-span-9 space-y-6">
                {selectedPage ? (
                  <div className="space-y-6">
                    <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 font-mono">/{selectedPage.slug} 화면 블록 레이아웃</h3>
                        <p className="text-xs text-slate-500 mt-1">각 구역을 드롭인 텍스트 영역으로 실시간 업데이트할 수 있습니다.</p>
                      </div>

                      {/* Add block tools */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddBlock(selectedPage, "hero")}
                          className="bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-600 font-bold text-xs py-2 px-3.5 rounded-xl transition shadow-xs flex items-center gap-1"
                        >
                          + 히어로 추가
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock(selectedPage, "features")}
                          className="bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-600 font-bold text-xs py-2 px-3.5 rounded-xl transition shadow-xs flex items-center gap-1"
                        >
                          + 특장점 bento 추가
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddBlock(selectedPage, "text")}
                          className="bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-600 font-bold text-xs py-2 px-3.5 rounded-xl transition shadow-xs flex items-center gap-1"
                        >
                          + 텍스트문단 추가
                        </button>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {selectedPage.blocks.map((block, index) => (
                        <div key={block.id} className="bg-white border border-slate-200/85 p-6 rounded-3xl shadow-sm relative group">
                          <div className="absolute right-6 top-6 flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                              구역 {index + 1}: {block.type}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(selectedPage, block.id)}
                              className={`h-8 rounded-full flex items-center justify-center transition border shadow-sm active:scale-95 duration-100 text-[10px] font-bold ${
                                deleteConfirmKey === `block:${selectedPage.id}:${block.id}`
                                  ? "bg-red-600 text-white border-red-500 px-3"
                                  : "w-8 bg-red-100/60 hover:bg-red-500 hover:text-white text-red-600 border-red-200/50"
                              }`}
                              title={deleteConfirmKey === `block:${selectedPage.id}:${block.id}` ? "한 번 더 눌러 삭제 확정" : "이 구역 파기"}
                            >
                              {deleteConfirmKey === `block:${selectedPage.id}:${block.id}` ? "삭제확정" : <Trash className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="space-y-4 max-w-2xl">
                            {/* Title controller */}
                            <div>
                              <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">제목 텍스트</label>
                              <input
                                type="text"
                                value={block.title || ""}
                                onChange={(e) => handleUpdateBlockField(selectedPage, block.id, { title: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 font-bold focus:bg-white focus:outline-none"
                              />
                            </div>

                            {/* Subtitle / Details controller */}
                            {block.type !== "text" ? (
                              <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">서브타이틀 텍스트</label>
                                <input
                                  type="text"
                                  value={block.subtitle || ""}
                                  onChange={(e) => handleUpdateBlockField(selectedPage, block.id, { subtitle: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 focus:bg-white focus:outline-none"
                                />
                              </div>
                            ) : (
                              <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">상세 긴 텍스트 내용</label>
                                <textarea
                                  rows={4}
                                  value={block.content || ""}
                                  onChange={(e) => handleUpdateBlockField(selectedPage, block.id, { content: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600/10 resize-none font-sans"
                                />
                              </div>
                            )}

                            {/* Image URL controller for image block types */}
                            {block.type === "image" && (
                              <div>
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">업로드 이미지 주소 (URL 경로)</label>
                                <input
                                  type="text"
                                  placeholder="예: /assets/product/toss-front.webp 또는 업로드한 이미지 주소"
                                  value={block.imageUrl || ""}
                                  onChange={(e) => handleUpdateBlockField(selectedPage, block.id, { imageUrl: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                                />
                              </div>
                            )}

                            {/* Hero & Banner & Image Button Controller */}
                            {(block.type === "hero" || block.type === "banner" || block.type === "image") && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">이동버튼 이름 (비워두면 버튼 미노출)</label>
                                  <input
                                    type="text"
                                    placeholder="비워두면 버튼 미노출"
                                    value={block.buttonText || ""}
                                    onChange={(e) => handleUpdateBlockField(selectedPage, block.id, { buttonText: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">연결 메뉴 타겟</label>
                                  <select
                                    value={block.buttonLink || ""}
                                    onChange={(e) => handleUpdateBlockField(selectedPage, block.id, { buttonLink: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-600 focus:bg-white focus:outline-none"
                                  >
                                    <option value="request_consult">상담신청 링크</option>
                                    <option value="request_paper">용지배송 신청 링크</option>
                                    <option value="board_suggestions">건의게시판</option>
                                    <option value="board_resources">자료다운로드 실</option>
                                    {pages.map(p => (
                                      <option key={p.slug} value={p.slug}>페이지: /{p.slug}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* Features block items tracker */}
                            {block.type === "features" && (
                              <div className="space-y-2 border border-slate-100 p-4 rounded-2xl bg-slate-50/50 mt-4">
                                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Bento 특장점 카드 설정</label>
                                {(block.items || []).map((item, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      placeholder="카드제목"
                                      value={item.title}
                                      onChange={(e) => {
                                        const nItems = [...(block.items || [])];
                                        nItems[idx] = { ...nItems[idx], title: e.target.value };
                                        handleUpdateBlockField(selectedPage, block.id, { items: nItems });
                                      }}
                                      className="flex-1 bg-white border border-slate-200 text-xs px-3 py-1.5 rounded-lg focus:outline-none font-bold text-slate-800"
                                    />
                                    <input
                                      type="text"
                                      placeholder="카드안내 상세"
                                      value={item.desc}
                                      onChange={(e) => {
                                        const nItems = [...(block.items || [])];
                                        nItems[idx] = { ...nItems[idx], desc: e.target.value };
                                        handleUpdateBlockField(selectedPage, block.id, { items: nItems });
                                      }}
                                      className="flex-[2] bg-white border border-slate-200 text-xs px-3 py-1.5 rounded-lg focus:outline-none text-slate-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nItems = (block.items || []).filter((_, i) => i !== idx);
                                        handleUpdateBlockField(selectedPage, block.id, { items: nItems });
                                      }}
                                      className="text-red-500 hover:text-red-700 text-xs font-semibold px-2"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nItems = [...(block.items || []), { title: "새로운 특장점", desc: "여기에 메리트를 적으세요." }];
                                    handleUpdateBlockField(selectedPage, block.id, { items: nItems });
                                  }}
                                  className="text-blue-600 hover:text-blue-700 text-xs font-bold pt-1 flex items-center gap-1"
                                >
                                  + 특장점 소카드 추가
                                </button>
                              </div>
                            )}

                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 text-sm bg-white border border-slate-100 rounded-3xl">
                    선택한 페이지 리소스가 존재하지 않거나 구성이 비어 있습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- Product Manager List --- */}
        {activeSubTab === "products" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-slate-800">단말기 및 가맹 상품정보 관리</h2>
                <p className="text-sm text-slate-500 mt-1">고객용 제품소개에 등장하는 서명 단말기, 태블릿 포스, 무인 결제 키오스크 기종을 등록하세요.</p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct({
                    name: "",
                    category: "포스",
                    description: "",
                    imageUrl: "/assets/product/toss-front.webp",
                    price: "합리적 임대/구매 조건",
                    features: ["설치 구성 상담", "현장 사용 교육"],
                    specs: { "제품구분": "상담 후 확정", "설치조건": "매장 환경 확인" }
                  });
                  setIsProductListOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl shrink-0 text-sm shadow-sm flex items-center gap-1"
              >
                + 신규 하드웨어 기종 등록
              </button>
            </div>

            {editingProduct ? (
              <form onSubmit={handleSaveProduct} className="bg-white border p-8 rounded-3xl shadow-sm max-w-2xl mx-auto space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                  <h3 className="text-lg font-bold text-slate-800">제품 데이터 등록 및 세팅</h3>
                  <button
                    type="button"
                    onClick={() => { setEditingProduct(null); setIsProductListOpen(true); }}
                    className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
                  >
                    목록으로 돌아가기
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">제품 모델명 *</label>
                    <input
                      type="text"
                      required
                      placeholder="Smart Terminal T-8000"
                      value={editingProduct.name || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">대표 기종 대분류</label>
                    <select
                      value={editingProduct.category || "포스"}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none"
                    >
                      <option value="포스">슬림 통합 POS</option>
                      <option value="단말기">IC 유무선 단말기</option>
                      <option value="키오스크">무인 키오스크 패키지</option>
                      <option value="주변기기">프린터·금전함·스캐너</option>
                      <option value="통신">인터넷·전화</option>
                      <option value="보안">CCTV·보안</option>
                      <option value="기타">기타 정산 기기</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">임대 및 보급가 요금제 조건</label>
                    <input
                      type="text"
                      placeholder="구성·임대 조건 상담"
                      value={editingProduct.price || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">제품 외형 이미지 (공개 URL/임시 미리보기)</label>
                    <div className="border border-slate-200 bg-slate-50 rounded-xl p-3 space-y-3">
                      <div className="flex items-center gap-3">
                        {editingProduct.imageUrl ? (
                          <div className="relative group/pth h-12 w-12 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                            <img src={editingProduct.imageUrl} className="w-full h-full object-contain" alt="Product preview" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => setEditingProduct({ ...editingProduct, imageUrl: "" })}
                              className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover/pth:opacity-100 transition"
                              title="삭제"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder="공개 가능한 /assets/... 또는 https://... 주소"
                          value={editingProduct.imageUrl || ""}
                          onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                          className="flex-1 bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono truncate"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {editingProduct.imageUrl?.startsWith("data:image/")
                            ? "로컬 미리보기 전용 · 공개 저장 전 URL과 권리 확인이 필요합니다."
                            : "공개 경로에는 원본 출처와 사용권 상태가 필요합니다."}
                        </span>
                        
                        <label className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded-lg text-xs cursor-pointer transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0">
                          <Plus className="w-3 h-3" />
                          <span>PC 미리보기 선택</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (re) => {
                                  const img = new Image();
                                  img.onload = () => {
                                    const MAX_WIDTH = 800;
                                    const MAX_HEIGHT = 800;
                                    let w = img.width;
                                    let h = img.height;
                                    if (w > MAX_WIDTH || h > MAX_HEIGHT) {
                                      if (w > h) {
                                        h = Math.round((h * MAX_WIDTH) / w);
                                        w = MAX_WIDTH;
                                      } else {
                                        w = Math.round((w * MAX_HEIGHT) / h);
                                        h = MAX_HEIGHT;
                                      }
                                    }
                                    const canvas = document.createElement("canvas");
                                    canvas.width = w;
                                    canvas.height = h;
                                    const ctx = canvas.getContext("2d");
                                    if (ctx) {
                                      ctx.clearRect(0, 0, w, h); // Clear background to preserve transparency
                                      ctx.drawImage(img, 0, 0, w, h);
                                      
                                      const nameLower = file.name.toLowerCase();
                                      const isTransparent = file.type === "image/png" || 
                                                            file.type === "image/gif" || 
                                                            file.type === "image/webp" || 
                                                            file.type === "image/svg+xml" ||
                                                            nameLower.endsWith(".png") || 
                                                            nameLower.endsWith(".gif") || 
                                                            nameLower.endsWith(".webp") || 
                                                            nameLower.endsWith(".svg");
                                                            
                                      const compressed = canvas.toDataURL(isTransparent ? "image/png" : "image/jpeg", 0.82);
                                      setEditingProduct({
                                        ...editingProduct,
                                        imageUrl: compressed,
                                        imageSourceUrl: `local-preview:${file.name}`,
                                        imageRightsStatus: "internal_only",
                                      });
                                    } else {
                                      setEditingProduct({
                                        ...editingProduct,
                                        imageUrl: re.target?.result as string,
                                        imageSourceUrl: `local-preview:${file.name}`,
                                        imageRightsStatus: "internal_only",
                                      });
                                    }
                                  };
                                  img.src = re.target?.result as string;
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">이미지 원본 출처</label>
                    <input
                      type="text"
                      placeholder="공식 URL 또는 파트너 원본 식별자"
                      value={editingProduct.imageSourceUrl || ""}
                      onChange={(e) => setEditingProduct({ ...editingProduct, imageSourceUrl: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">공개 사용권 상태</label>
                    <select
                      value={editingProduct.imageRightsStatus || "pending"}
                      onChange={(e) => setEditingProduct({ ...editingProduct, imageRightsStatus: e.target.value as Product["imageRightsStatus"] })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none"
                    >
                      <option value="pending">확인 필요</option>
                      <option value="verified">확인 완료</option>
                      <option value="internal_only">내부 미리보기 전용</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">기종 상세 소개글</label>
                  <textarea
                    rows={3}
                    placeholder="슬림하고 현대적인 스타일로 주방 공간을 절약하는 최신 POS 기기입니다."
                    value={editingProduct.description || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow transition"
                >
                  기종 사양 정보 저장 완료
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length === 0 ? (
                  <div className="col-span-3 py-16 text-center text-slate-400 text-sm bg-white rounded-3xl border border-dashed border-slate-200">
                    등록되어 입고 처리된 가맹점 보급 기종 상품이 없습니다. 버튼을 눌러 등록하세요.
                  </div>
                ) : (
                  products.map((p) => (
                    <div key={p.id} className="bg-white border rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
                      <div className="p-6">
                        <div className="relative h-44 bg-white border border-slate-100 rounded-2xl overflow-hidden flex items-center justify-center mb-4">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-4" />
                          ) : (
                            <ShoppingBag className="w-12 h-12 text-slate-300" />
                          )}
                          <span className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full">
                            {p.category}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-lg">{p.name}</h4>
                        <p className="text-slate-500 text-xs leading-relaxed mt-2 line-clamp-2 h-8">{p.description}</p>
                        <p className="text-blue-600 text-sm font-semibold mt-3">{p.price || "가격협의가능"}</p>
                      </div>

                      <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => { setEditingProduct(p); setIsProductListOpen(false); }}
                          className="text-slate-600 hover:text-blue-600 font-bold text-xs px-3 py-2 rounded-xl bg-white border hover:bg-blue-50/20 active:scale-95 transition"
                        >
                          상세 수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className={`font-bold text-xs px-3 py-2 rounded-xl active:scale-95 transition ${
                            deleteConfirmKey === `product:${p.id}`
                              ? "bg-red-600 text-white"
                              : "text-slate-400 hover:text-red-500"
                          }`}
                        >
                          {deleteConfirmKey === `product:${p.id}` ? "폐기 확정" : "폐기"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* --- Consultations Forms Tracker --- */}
        {activeSubTab === "consultations" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-black text-slate-800">가맹 및 장비 공급 상담 신청서</h2>
              <p className="text-sm text-slate-500 mt-1">포스 및 지불 단말기 도입 희망 요망 가맹주 문의서 원본 명부입니다.</p>
            </div>

            <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-sm text-slate-700">
                <table className="w-full table-auto text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <th className="px-6 py-4 text-center">진행 단계</th>
                      <th className="px-6 py-4">담당 대표자 성함</th>
                      <th className="px-6 py-4">가맹 및 지점상호</th>
                      <th className="px-6 py-4">희망 제품구분</th>
                      <th className="px-6 py-4">연락 전화번호</th>
                      <th className="px-6 py-4">접수 일시</th>
                      <th className="px-6 py-4 text-center">행동 사항</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {consults.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                          모든 상담서가 처리되었거나 신규 접수된 문의가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      consults.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              c.status === "완료"
                                ? "bg-slate-100 text-slate-600"
                                : c.status === "작업등록"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-emerald-50 text-emerald-600"
                            }`}>
                              {c.status === "완료" ? "전화처리됨" : c.status === "작업등록" ? "작업진행중" : "엔지니어대기"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">{c.customerName}</td>
                          <td className="px-6 py-4">
                            <div>{c.businessName}</div>
                            <div className="text-xs text-slate-400 font-semibold">{c.businessType}</div>
                          </td>
                          <td className="px-6 py-4 text-blue-600 font-bold">{c.productOfInterest}</td>
                          <td className="px-6 py-4 font-mono">{c.contact}</td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-xs">{new Date(c.createdAt).toLocaleString()}</td>
                          <td className="px-6 py-4 text-center flex items-center justify-center gap-1.5 pt-5">
                            {!c.linkedTaskId && (
                              <button
                                type="button"
                                onClick={() => handleToggleConsultStatus(c.id, c.status)}
                                className="text-slate-600 hover:text-blue-600 hover:bg-slate-100 font-bold text-xs py-1.5 px-3 rounded-lg border shadow-xs"
                              >
                                {c.status === "완료" ? "대기로 변경" : "완료처리"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteConsultation(c.id)}
                              disabled={Boolean(c.linkedTaskId)}
                              title={c.linkedTaskId ? "작업으로 등록된 상담 원본은 삭제할 수 없습니다." : undefined}
                              className={`text-xs font-bold px-2 py-1 rounded-lg transition ${
                                c.linkedTaskId
                                  ? "text-slate-400 cursor-not-allowed"
                                  : deleteConfirmKey === `consult:${c.id}`
                                    ? "bg-red-600 text-white"
                                    : "text-red-500 hover:text-red-700"
                              }`}
                            >
                              {c.linkedTaskId ? "작업 연결됨" : deleteConfirmKey === `consult:${c.id}` ? "삭제 확정" : "삭제"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- Papers Requests Tracker --- */}
        {activeSubTab === "papers" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-black text-slate-800">영수증 용지 배송 요청 명부</h2>
              <p className="text-sm text-slate-500 mt-1">거래 여부와 용지 규격, 배송 조건을 확인해야 하는 요청 목록입니다.</p>
            </div>

            <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-sm text-slate-700">
                <table className="w-full table-auto text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <th className="px-6 py-4 text-center">출고 진행</th>
                      <th className="px-6 py-4">신청 상호 및 성함</th>
                      <th className="px-6 py-4">배송 주소 *</th>
                      <th className="px-6 py-4">기종 모델명</th>
                      <th className="px-6 py-4 text-center">신청 수량</th>
                      <th className="px-6 py-4">신청 일시</th>
                      <th className="px-6 py-4 text-center">변경 및 행동</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {papers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400 text-sm">
                          처리할 용지 배송 요청이 없거나 모든 요청이 출고 승인되었습니다.
                        </td>
                      </tr>
                    ) : (
                      papers.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              p.status === "완료"
                                ? "bg-slate-100 text-slate-500"
                                : p.status === "작업등록"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-blue-50 text-blue-600"
                            }`}>
                              {p.status === "완료" ? "출고배송완료" : p.status === "작업등록" ? "배송작업진행" : "택배접수대기"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            <div>{p.customerName}</div>
                            <div className="text-xs text-slate-400 font-mono font-normal mt-0.5">{p.contact}</div>
                          </td>
                          <td className="px-6 py-4 select-all text-xs font-semibold text-slate-600 max-w-xs truncate" title={p.address}>{p.address}</td>
                          <td className="px-6 py-4 text-slate-500">{p.deviceModel || "기종 미지정"}</td>
                          <td className="px-6 py-4 text-center font-bold text-blue-700">{p.quantity}</td>
                          <td className="px-6 py-4 text-slate-400 font-mono text-xs">{new Date(p.createdAt).toLocaleString()}</td>
                          <td className="px-6 py-4 text-center flex items-center justify-center gap-1.5 pt-5">
                            {!p.linkedTaskId && (
                              <button
                                type="button"
                                onClick={() => handleTogglePaperStatus(p.id, p.status)}
                                className="text-slate-600 hover:text-blue-600 hover:bg-slate-100 font-bold text-xs py-1.5 px-3 rounded-lg border shadow-xs"
                              >
                                {p.status === "완료" ? "접수 대기로" : "출고 완료"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeletePaperRequest(p.id)}
                              disabled={Boolean(p.linkedTaskId)}
                              title={p.linkedTaskId ? "작업으로 등록된 용지 요청 원본은 삭제할 수 없습니다." : undefined}
                              className={`text-xs font-bold px-2 py-1 rounded-lg transition ${
                                p.linkedTaskId
                                  ? "text-slate-400 cursor-not-allowed"
                                  : deleteConfirmKey === `paper:${p.id}`
                                    ? "bg-red-600 text-white"
                                    : "text-red-550 hover:text-red-700"
                              }`}
                            >
                              {p.linkedTaskId ? "작업 연결됨" : deleteConfirmKey === `paper:${p.id}` ? "삭제 확정" : "삭제"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
