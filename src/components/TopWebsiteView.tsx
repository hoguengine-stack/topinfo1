import React from "react";
import { CMSPage, Product, CMSBlock, NavigationSettings } from "../types";
import { motion, AnimatePresence } from "motion/react";

// Import modular sub-components
import { WebsiteHeader } from "./WebsiteHeader";
import { WebsiteFooter } from "./WebsiteFooter";
import { WebsiteHUDPanel } from "./WebsiteHUDPanel";
import { WebsiteLoginModal } from "./WebsiteLoginModal";
import { WebsiteBlockRenderer } from "./WebsiteBlockRenderer";

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
            if (currentUrl !== page.slug) return null;
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

                  // Product catalog props
                  products={products}
                  setProducts={setProducts}
                  productFilter={productFilter}
                  setProductFilter={setProductFilter}
                  scheduleProductWrite={scheduleProductWrite}
                />
              </motion.div>
            );
          })}

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
