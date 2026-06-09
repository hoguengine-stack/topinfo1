import React from "react";
import {
  Trash2, Smartphone, Check, Plus, Lock, ShieldAlert
} from "lucide-react";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { CMSPage, Product, CMSBlock, NavigationSettings } from "../types";
import { motion, AnimatePresence } from "motion/react";

// Import modular sub-components
import { WebsiteHeader } from "./WebsiteHeader";
import { WebsiteFooter } from "./WebsiteFooter";
import { WebsiteHUDPanel } from "./WebsiteHUDPanel";
import { WebsiteLoginModal } from "./WebsiteLoginModal";
import { WebsiteBlockRenderer } from "./WebsiteBlockRenderer";

// Sub-components as imported inside TopWebsite originally
import { ConsultationForm, PaperRollRequestForm } from "./WebForms";
import { SuggestionBoard, ResourceBoard } from "./WebBoards";
import { WebAdmin } from "./WebAdmin";

export interface TopWebsiteViewProps {
  currentUrl: string;
  setCurrentUrl: (val: string) => void;
  pages: CMSPage[];
  setPages: React.Dispatch<React.SetStateAction<CMSPage[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  scheduleProductWrite: (productId: string, fields: Partial<Product>) => void;
  productFilter: string;
  setProductFilter: (val: string) => void;
  isEditModeActive: boolean;
  setIsEditModeActive: (val: boolean) => void;
  activeEditTarget: any;
  setActiveEditTarget: (val: any) => void;
  footerInfo: any;
  setFooterInfo: (val: any) => void;
  navigationSettings: NavigationSettings;

  user: any;
  profile: any;
  logout: () => void;
  isEmployee: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (val: boolean) => void;
  authFormData: any;
  setAuthFormData: any;
  authError: string | null;
  authLoading: boolean;
  handleAuthSubmit: (e: React.FormEvent) => void;
  showGoogleLogin: boolean;
  setShowGoogleLogin: (val: boolean) => void;
  handleGoogleLogin: () => void;
  googleClickTimes: number[];
  setGoogleClickTimes: React.Dispatch<React.SetStateAction<number[]>>;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (val: boolean) => void;
  isSignUpMode: boolean;
  setIsSignUpMode: (val: boolean) => void;
  isCmsSaving?: boolean;
  schedulePageWrite?: (pageId: string, blocks: CMSPage["blocks"]) => void;

  handleLinkClick: (slug: string) => void;
  handleMoveBlockUp: (page: CMSPage, index: number) => void;
  handleMoveBlockDown: (page: CMSPage, index: number) => void;
  handleDeleteBlock: (page: CMSPage, index: number) => void;
  handleInsertBlock: (page: CMSPage, index: number, type: "hero" | "features" | "text" | "banner" | "image" | "divider") => void;
  handleUpdateBlockData: (page: CMSPage, blockId: string, updatedData: Partial<CMSBlock>) => Promise<void>;

  handleHUDChange: (updatedFields: Partial<CMSBlock>) => Promise<void>;
  handleHUDCardChange: (updatedFields: Partial<{ title: string; desc: string; icon: string; buttonText?: string; buttonLink?: string }>) => Promise<void>;
  handleHUDDeleteCardItem: () => Promise<void>;
  handleNavTitleChange: (newTitle: string) => Promise<void>;
  handleNavVisibilityChange: (visible: boolean) => Promise<void>;

  showAddBlockMenuAtIndex: { pageId: string; index: number } | null;
  setShowAddBlockMenuAtIndex: (val: { pageId: string; index: number } | null) => void;

  onEnterInternalDashboard: () => void;
  isAdmin: boolean;
  db: any;
}

export const TopWebsiteView: React.FC<TopWebsiteViewProps> = (props) => {
  const {
    currentUrl,
    setCurrentUrl,
    pages,
    setPages,
    products,
    setProducts,
    scheduleProductWrite,
    productFilter,
    setProductFilter,
    isEditModeActive,
    setIsEditModeActive,
    activeEditTarget,
    setActiveEditTarget,
    footerInfo,
    setFooterInfo,
    navigationSettings,
    user,
    profile,
    logout,
    isEmployee,
    showLoginModal,
    setShowLoginModal,
    authFormData,
    setAuthFormData,
    authError,
    authLoading,
    handleAuthSubmit,
    showGoogleLogin,
    setShowGoogleLogin,
    handleGoogleLogin,
    googleClickTimes,
    setGoogleClickTimes,
    mobileMenuOpen,
    setMobileMenuOpen,
    isSignUpMode,
    setIsSignUpMode,
    isCmsSaving,
    schedulePageWrite,
    handleLinkClick,
    handleMoveBlockUp,
    handleMoveBlockDown,
    handleDeleteBlock,
    handleInsertBlock,
    handleUpdateBlockData,
    handleHUDChange,
    handleHUDCardChange,
    handleHUDDeleteCardItem,
    handleNavTitleChange,
    handleNavVisibilityChange,
    showAddBlockMenuAtIndex,
    setShowAddBlockMenuAtIndex,
    onEnterInternalDashboard,
    isAdmin,
    db,
  } = props;

  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-600/10 selection:text-blue-600 transition-all duration-300 overflow-x-hidden">

      {/* 1. Header Component */}
      <WebsiteHeader
        isAdmin={isAdmin}
        isEmployee={isEmployee}
        isEditModeActive={isEditModeActive}
        setIsEditModeActive={setIsEditModeActive}
        setEditingBlock={setActiveEditTarget}
        setShowAddBlockMenuAtIndex={setShowAddBlockMenuAtIndex}
        currentUrl={currentUrl}
        pages={pages}
        navigationSettings={navigationSettings}
        setActiveEditTarget={setActiveEditTarget}
        handleLinkClick={handleLinkClick}
        user={user}
        profile={profile}
        logout={logout}
        setIsSignUpMode={setIsSignUpMode}
        setShowLoginModal={setShowLoginModal}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* 2. Main Space contents */}
      <main className="py-12 md:py-16">
        <AnimatePresence mode="wait">

           {/* Dynamic Pages Renderer via WebsiteBlockRenderer */}
          {pages.map(page => {
            if (currentUrl !== page.slug || page.slug === "products") return null;
            return (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <WebsiteBlockRenderer
                  page={page}
                  pages={pages}
                  setPages={setPages}
                  isEditModeActive={isEditModeActive}
                  activeEditTarget={activeEditTarget}
                  setActiveEditTarget={setActiveEditTarget}
                  showAddBlockMenuAtIndex={showAddBlockMenuAtIndex}
                  setShowAddBlockMenuAtIndex={setShowAddBlockMenuAtIndex}
                  handleMoveBlockUp={handleMoveBlockUp}
                  handleMoveBlockDown={handleMoveBlockDown}
                  handleDeleteBlock={handleDeleteBlock}
                  handleInsertBlock={handleInsertBlock}
                  handleLinkClick={handleLinkClick}
                  handleUpdateBlockData={handleUpdateBlockData}
                  db={db}
                />
              </motion.div>
            );
          })}

          {/* --- Render Form and Board Overlays as sub-pages in CMS --- */}
          {currentUrl === "request_consult" && (
            <motion.div
              key="request_consult"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <ConsultationForm />
            </motion.div>
          )}
          {currentUrl === "request_paper" && (
            <motion.div
              key="request_paper"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <PaperRollRequestForm />
            </motion.div>
          )}
          {currentUrl === "board_suggestions" && (
            <motion.div
              key="board_suggestions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <SuggestionBoard />
            </motion.div>
          )}
          {currentUrl === "board_resources" && (
            <motion.div
              key="board_resources"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <ResourceBoard />
            </motion.div>
          )}

          {/* --- Hardcoded Hardware Catalog page --- */}
          {currentUrl === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-5xl mx-auto px-6 space-y-10"
            >
              {pages.map(page => {
                if (page.slug !== "products") return null;
                return (
                  <WebsiteBlockRenderer
                    key={page.id}
                    page={page}
                    pages={pages}
                    setPages={setPages}
                    isEditModeActive={isEditModeActive}
                    activeEditTarget={activeEditTarget}
                    setActiveEditTarget={setActiveEditTarget}
                    showAddBlockMenuAtIndex={showAddBlockMenuAtIndex}
                    setShowAddBlockMenuAtIndex={setShowAddBlockMenuAtIndex}
                    handleMoveBlockUp={handleMoveBlockUp}
                    handleMoveBlockDown={handleMoveBlockDown}
                    handleDeleteBlock={handleDeleteBlock}
                    handleInsertBlock={handleInsertBlock}
                    handleLinkClick={handleLinkClick}
                    handleUpdateBlockData={handleUpdateBlockData}
                    db={db}
                  />
                );
              })}

              {/* Product categories tab trigger */}
              <div className="flex justify-center gap-2">
                {["전체", "포스", "단말기", "키오스크"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setProductFilter(cat)}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                      productFilter === cat
                        ? "bg-slate-900 text-white shadow"
                        : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {cat === "전체" ? "전체 기종" : cat === "포스" ? "통합 슬림 POS" : cat === "단말기" ? "스마트 단말기" : "무인 키오스크"}
                  </button>
                ))}
              </div>

              {/* List products */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left mt-8">
                {products
                  .filter(p => productFilter === "전체" || p.category === productFilter)
                  .map((p) => {
                    const isConfirmingDelete = confirmDeleteId === p.id;
                    return (
                      <div key={p.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-2xl hover:border-slate-300/80 hover:-translate-y-1 transform duration-300 transition-all flex flex-col justify-between relative group/prod">

                        {/* Interactive Non-blocking Delete Overlay (bypasses sandboxed iframe confirm dialog limits) */}
                        {isConfirmingDelete && (
                          <div className="absolute inset-0 bg-slate-900/95 z-40 flex flex-col items-center justify-center p-6 text-center text-white">
                            <Trash2 className="w-8 h-8 text-rose-500 mb-2 animate-bounce" />
                            <h4 className="font-extrabold text-sm mb-1 text-rose-300">"{p.name}" 삭제</h4>
                            <p className="text-[11px] text-slate-300 mb-4 leading-relaxed">
                              이 결제 기기를 제품 목록과 가이드 카탈로그에서 정말 완전히 삭제 처리하시겠습니까? (복구 불가)
                            </p>
                            <div className="flex gap-2 w-full max-w-[200px]">
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await deleteDoc(doc(db, "products", p.id));
                                  } catch (err) {
                                    console.error("Failed to delete product: ", err);
                                  }
                                  setConfirmDeleteId(null);
                                }}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white py-2 rounded-xl text-xs font-bold transition shadow-md"
                              >
                                네, 삭제
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(null);
                                }}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white py-2 rounded-xl text-xs font-bold transition"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Regular Trash Icon Trigger Button */}
                        {isEditModeActive && !isConfirmingDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(p.id);
                            }}
                            className="absolute top-3 right-3 z-30 bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-xl transition shadow active:scale-95 duration-150 animate-in fade-in"
                            title="기기 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div>
                          <div className="h-44 bg-white border-b border-slate-100 relative flex items-center justify-center overflow-hidden">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-4 group-hover/prod:scale-105 transition-transform duration-500" />
                            ) : (
                              <Smartphone className="w-12 h-12 text-slate-300" />
                            )}
                            <span className="absolute top-4 left-4 bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-100 z-10">
                              {p.category}
                            </span>
                          </div>

                          <div className="p-6 space-y-3">
                            {isEditModeActive ? (
                              <div className="space-y-3 w-full text-left">
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">제품명</label>
                                  <input
                                    type="text"
                                    value={p.name}
                                    onChange={(e) => {
                                      const updated = products.map(item => item.id === p.id ? { ...item, name: e.target.value } : item);
                                      setProducts(updated);
                                      scheduleProductWrite(p.id, { name: e.target.value });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">설명</label>
                                  <textarea
                                    rows={2}
                                    value={p.description || ""}
                                    onChange={(e) => {
                                      const updated = products.map(item => item.id === p.id ? { ...item, description: e.target.value } : item);
                                      setProducts(updated);
                                      scheduleProductWrite(p.id, { description: e.target.value });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-650 leading-snug"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">분류</label>
                                  <select
                                    value={p.category}
                                    onChange={(e) => {
                                      const val = e.target.value as any;
                                      const updated = products.map(item => item.id === p.id ? { ...item, category: val } : item);
                                      setProducts(updated);
                                      scheduleProductWrite(p.id, { category: val });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-bold"
                                  >
                                    <option value="포스">포스</option>
                                    <option value="단말기">단말기</option>
                                    <option value="키오스크">키오스크</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">사진 URL</label>
                                  <input
                                    type="text"
                                    value={p.imageUrl || ""}
                                    onChange={(e) => {
                                      const updated = products.map(item => item.id === p.id ? { ...item, imageUrl: e.target.value } : item);
                                      setProducts(updated);
                                      scheduleProductWrite(p.id, { imageUrl: e.target.value });
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px]"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">핵심 특장점 (최대 3개)</label>
                                  <div className="space-y-1.5">
                                    {[0, 1, 2].map((idx) => {
                                      const currentFeatures = p.features && Array.isArray(p.features) ? [...p.features] : [];
                                      while (currentFeatures.length <= idx) {
                                        currentFeatures.push("");
                                      }
                                      return (
                                        <div key={idx} className="flex items-center gap-1.5">
                                          <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                          <input
                                            type="text"
                                            placeholder={`특장점 ${idx + 1} (예: ${idx === 0 ? "직관적 UI로 누구나 간편 주문" : idx === 1 ? "스탠드/벽걸이 모드 전면 커스텀 조립" : "식음료 전용 결제 앱 기본 내장"})`}
                                            value={currentFeatures[idx] || ""}
                                            onChange={(e) => {
                                              const nextFeatures = [...currentFeatures];
                                              nextFeatures[idx] = e.target.value;
                                              const updated = products.map(item => item.id === p.id ? { ...item, features: nextFeatures } : item);
                                              setProducts(updated);
                                              scheduleProductWrite(p.id, { features: nextFeatures });
                                            }}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-sans"
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <h4 className="text-lg font-black text-slate-800">{p.name}</h4>
                                <p className="text-slate-555 text-xs leading-relaxed line-clamp-2 h-8">{p.description}</p>

                                <div className="space-y-1">
                                  {(p.features || []).map((f, i) => (
                                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> {f}
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400">보급요건:</span>
                          {isEditModeActive ? (
                            <input
                              type="text"
                              value={p.price || "무상제공 상담대상"}
                              onChange={(e) => {
                                const updated = products.map(item => item.id === p.id ? { ...item, price: e.target.value } : item);
                                setProducts(updated);
                                scheduleProductWrite(p.id, { price: e.target.value });
                              }}
                              className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-bold w-40 text-right text-blue-600 font-sans"
                            />
                          ) : (
                            <span className="text-blue-600 text-sm font-extrabold">{p.price || "무상제공 상담대상"}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {isEditModeActive && (
                  <button
                    type="button"
                    onClick={async () => {
                      const newId = "product-" + Date.now();
                      const newProduct = {
                        id: newId,
                        name: "새로운 무상 단말기 모델",
                        category: productFilter === "전체" ? "단말기" : productFilter,
                        description: "탑정보통신에서 특별 가맹 공급해 드리는 검증된 프리미엄 스마트 결제 모듈입니다.",
                        features: ["초고속 NFC 결제 연동", "비즈니스 평생 수리 보증"],
                        price: "무상제공 상담대상",
                        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1d704d3?auto=format&fit=crop&w=400&q=80",
                        createdAt: new Date().toISOString()
                      };
                      await setDoc(doc(db, "products", newId), newProduct);
                    }}
                    className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-white hover:bg-blue-50/5 text-blue-600 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition min-h-[380px] shadow-sm active:scale-95 duration-150"
                  >
                    <Plus className="w-8 h-8 text-blue-500 animate-pulse" />
                    <span className="font-extrabold text-sm">새로운 결제 장비/기기 추가</span>
                    <span className="text-[11px] text-slate-400 font-medium">실시간으로 카탈로그에 가입 노출됩니다</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* --- Custom Admin layout block --- */}
          {currentUrl === "admin" && isEmployee && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <WebAdmin onOpenTasks={onEnterInternalDashboard} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 3. Footer */}
      <WebsiteFooter
        isEditModeActive={isEditModeActive}
        footerInfo={footerInfo}
        setFooterInfo={setFooterInfo}
        isEmployee={isEmployee}
        db={db}
        setCurrentUrl={setCurrentUrl}
        handleLinkClick={handleLinkClick}
      />

      {/* 4. Unified Authentication Modal Overlay */}
      <WebsiteLoginModal
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
        showGoogleLogin={showGoogleLogin}
        setShowGoogleLogin={setShowGoogleLogin}
        authFormData={authFormData}
        setAuthFormData={setAuthFormData}
        authError={authError}
        authLoading={authLoading}
        handleAuthSubmit={handleAuthSubmit}
        handleGoogleLogin={handleGoogleLogin}
        setGoogleClickTimes={setGoogleClickTimes}
        isSignUpMode={isSignUpMode}
        setIsSignUpMode={setIsSignUpMode}
      />

      {/* 5. Dynamic Inspector HUD Sidebar */}
      <WebsiteHUDPanel
        isEditModeActive={isEditModeActive}
        activeEditTarget={activeEditTarget}
        setActiveEditTarget={setActiveEditTarget}
        pages={pages}
        setPages={setPages}
        handleHUDChange={handleHUDChange}
        handleHUDCardChange={handleHUDCardChange}
        handleHUDDeleteCardItem={handleHUDDeleteCardItem}
        handleNavTitleChange={handleNavTitleChange}
        handleNavVisibilityChange={handleNavVisibilityChange}
        navigationSettings={navigationSettings}
        db={db}
        isCmsSaving={isCmsSaving}
      />

    </div>
  );
};
